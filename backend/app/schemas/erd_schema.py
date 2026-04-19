"""
ERD Data Contract — single source of truth for the DBDesign Platform.

This module defines every Pydantic model that:
  1. Validates the structured JSON output produced by Groq Llama 3.
  2. Drives all code-generation functions (SQL, Prisma, DBML, migrations).
  3. Is serialised and sent to the React Flow canvas for ERD rendering.

Design principles
-----------------
- All enums are string-backed so they serialise cleanly to/from JSON.
- Validators run at both field and model level; errors surface immediately
  instead of propagating into generators.
- `generated_at` and `prompt_hash` are set by the backend layer and are
  excluded from the AI-facing schema (LLM never sets them).
- Relationships are explicit (not derived on the fly) because the AI needs
  to express cardinality that is not always recoverable from FK topology
  alone (e.g. a self-referential hierarchy, a logical M:N on junction tables).
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ============================================================================
# Enumerations
# ============================================================================


class DBTarget(str, Enum):
    """Target database engine chosen by the user in the Generator UI."""

    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    SQLITE = "sqlite"


class DataType(str, Enum):
    """
    Canonical data types supported across all three target databases.

    Notes
    -----
    - SERIAL / BIGSERIAL are PostgreSQL-native; the SQL generator maps them
      to AUTO_INCREMENT (MySQL) or INTEGER (SQLite) when targeting those DBs.
    - TIMESTAMPTZ and JSONB are PostgreSQL-only; generators emit a warning and
      fall back to TIMESTAMP / JSON for MySQL/SQLite.
    - ENUM requires `Column.enum_values` to be populated.
    """

    # ── Numeric ──────────────────────────────────────────────────────────────
    SMALLINT   = "SMALLINT"
    INTEGER    = "INTEGER"
    BIGINT     = "BIGINT"
    REAL       = "REAL"
    FLOAT      = "FLOAT"
    DOUBLE     = "DOUBLE"
    DECIMAL    = "DECIMAL"    # type_params: {precision, scale}
    NUMERIC    = "NUMERIC"    # type_params: {precision, scale}
    SERIAL     = "SERIAL"     # PostgreSQL auto-increment integer
    BIGSERIAL  = "BIGSERIAL"  # PostgreSQL auto-increment bigint

    # ── String ───────────────────────────────────────────────────────────────
    CHAR       = "CHAR"       # type_params: {length}
    VARCHAR    = "VARCHAR"    # type_params: {length}
    TEXT       = "TEXT"

    # ── Date / Time ──────────────────────────────────────────────────────────
    DATE       = "DATE"
    TIME       = "TIME"
    TIMESTAMP  = "TIMESTAMP"
    TIMESTAMPTZ = "TIMESTAMPTZ"  # PostgreSQL only
    INTERVAL   = "INTERVAL"      # PostgreSQL only

    # ── Boolean ──────────────────────────────────────────────────────────────
    BOOLEAN    = "BOOLEAN"

    # ── Binary / Document ────────────────────────────────────────────────────
    BYTEA      = "BYTEA"    # PostgreSQL
    BLOB       = "BLOB"     # MySQL / SQLite
    JSON       = "JSON"
    JSONB      = "JSONB"    # PostgreSQL only

    # ── Identity ─────────────────────────────────────────────────────────────
    UUID       = "UUID"

    # ── User-defined ─────────────────────────────────────────────────────────
    ENUM       = "ENUM"     # requires Column.enum_values to be non-empty


class RelationshipType(str, Enum):
    ONE_TO_ONE   = "one_to_one"
    ONE_TO_MANY  = "one_to_many"
    MANY_TO_MANY = "many_to_many"


class FKAction(str, Enum):
    """Referential action triggered on the child row when the parent changes."""

    CASCADE     = "CASCADE"
    SET_NULL    = "SET_NULL"
    SET_DEFAULT = "SET_DEFAULT"
    RESTRICT    = "RESTRICT"
    NO_ACTION   = "NO_ACTION"


class IndexType(str, Enum):
    BTREE    = "BTREE"     # Default for all DBs
    HASH     = "HASH"      # PostgreSQL / MySQL
    GIN      = "GIN"       # PostgreSQL — JSONB, full-text, arrays
    GIST     = "GIST"      # PostgreSQL — geometric, range types
    FULLTEXT = "FULLTEXT"  # MySQL full-text search


# ============================================================================
# Column
# ============================================================================


class Column(BaseModel):
    """A single column within a database table."""

    name: str = Field(
        ...,
        description="Column name in snake_case (e.g. 'created_at', 'user_id').",
    )
    data_type: DataType

    type_params: Optional[Dict[str, int]] = Field(
        default=None,
        description=(
            "Extra parameters required by the data type:\n"
            "  VARCHAR / CHAR  → {'length': N}\n"
            "  DECIMAL / NUMERIC → {'precision': P, 'scale': S}"
        ),
    )

    is_primary_key: bool = Field(default=False)
    is_nullable: bool = Field(
        default=True,
        description="False emits NOT NULL. Automatically forced to False for PKs.",
    )
    is_unique: bool = Field(default=False)
    is_auto_increment: bool = Field(
        default=False,
        description=(
            "Signals that this column auto-increments. "
            "Generator maps this to SERIAL (PostgreSQL), "
            "AUTO_INCREMENT (MySQL), or AUTOINCREMENT (SQLite)."
        ),
    )

    default_value: Optional[str] = Field(
        default=None,
        description=(
            "Raw SQL DEFAULT expression as a string. "
            "Examples: 'NOW()', 'FALSE', \"'pending'\", 'gen_random_uuid()'."
        ),
    )
    check_constraint: Optional[str] = Field(
        default=None,
        description="Raw SQL CHECK expression, e.g. 'price > 0' or 'length(name) > 0'.",
    )
    enum_values: Optional[List[str]] = Field(
        default=None,
        description=(
            "Allowed values — required and only valid when data_type == ENUM. "
            "Example: ['pending', 'active', 'cancelled']."
        ),
    )
    comment: Optional[str] = Field(
        default=None,
        description="Column-level comment rendered in Prisma schema and SQL DDL.",
    )

    # ── Validators ───────────────────────────────────────────────────────────

    @field_validator("is_nullable", mode="before")
    @classmethod
    def pk_forces_not_null(cls, v: bool, info: Any) -> bool:
        """Primary key columns must never be nullable; correct silently."""
        if info.data.get("is_primary_key"):
            return False
        return v

    @field_validator("enum_values")
    @classmethod
    def enum_values_only_for_enum_type(
        cls, v: Optional[List[str]], info: Any
    ) -> Optional[List[str]]:
        """Reject enum_values on non-ENUM columns (fires when enum_values IS provided)."""
        dt = info.data.get("data_type")
        if v is not None and dt != DataType.ENUM:
            raise ValueError(
                f"'enum_values' is only valid for ENUM columns, not {dt}."
            )
        return v

    @model_validator(mode="after")
    def enum_column_must_have_values(self) -> Column:
        """
        Pydantic v2.10+ does not fire field_validator on absent/None fields,
        so the 'ENUM requires values' rule lives here as a model validator,
        which always runs after all fields are set.
        """
        if self.data_type == DataType.ENUM and not self.enum_values:
            raise ValueError(
                "'enum_values' must be a non-empty list when data_type is ENUM."
            )
        return self

    @field_validator("type_params")
    @classmethod
    def validate_type_params_shape(
        cls, v: Optional[Dict[str, int]], info: Any
    ) -> Optional[Dict[str, int]]:
        if v is None:
            return v
        dt = info.data.get("data_type")
        if dt in (DataType.VARCHAR, DataType.CHAR) and "length" not in v:
            raise ValueError(f"{dt} requires type_params to contain 'length'.")
        if dt in (DataType.DECIMAL, DataType.NUMERIC):
            if "precision" not in v or "scale" not in v:
                raise ValueError(
                    f"{dt} requires type_params to contain 'precision' and 'scale'."
                )
        return v


# ============================================================================
# ForeignKey
# ============================================================================


class ForeignKey(BaseModel):
    """
    A foreign-key constraint declared on a table.

    Supports single-column and composite multi-column foreign keys.
    The `columns` list (source) and `referenced_columns` list (target)
    must always have the same length.
    """

    constraint_name: Optional[str] = Field(
        default=None,
        description=(
            "Explicit constraint identifier, e.g. 'fk_order_items_order_id'. "
            "If omitted, the SQL generator auto-derives one."
        ),
    )
    columns: List[str] = Field(
        ...,
        min_length=1,
        description="One or more column names in *this* table that form the FK.",
    )
    referenced_table: str = Field(
        ...,
        description="Name of the table being referenced.",
    )
    referenced_columns: List[str] = Field(
        ...,
        min_length=1,
        description="Corresponding column names in the referenced table.",
    )
    on_delete: FKAction = Field(default=FKAction.NO_ACTION)
    on_update: FKAction = Field(default=FKAction.NO_ACTION)

    @model_validator(mode="after")
    def columns_arity_must_match(self) -> ForeignKey:
        if len(self.columns) != len(self.referenced_columns):
            raise ValueError(
                "ForeignKey.columns and ForeignKey.referenced_columns must be "
                f"the same length. Got {len(self.columns)} source column(s) "
                f"but {len(self.referenced_columns)} target column(s)."
            )
        return self


# ============================================================================
# Index
# ============================================================================


class Index(BaseModel):
    """A named index on one or more columns (excludes implicit PK indexes)."""

    name: str = Field(..., description="Index name, e.g. 'idx_users_email'.")
    columns: List[str] = Field(..., min_length=1)
    index_type: IndexType = Field(default=IndexType.BTREE)
    is_unique: bool = Field(default=False)
    where_clause: Optional[str] = Field(
        default=None,
        description=(
            "PostgreSQL partial index condition. "
            "Example: 'deleted_at IS NULL' creates a partial index on active rows."
        ),
    )


# ============================================================================
# Table
# ============================================================================


class Table(BaseModel):
    """
    A complete database table including columns, FK constraints, and indexes.
    """

    name: str = Field(
        ...,
        description=(
            "Table name in snake_case. Singular preferred by convention "
            "(e.g. 'user', 'order', 'order_item')."
        ),
    )
    columns: List[Column] = Field(..., min_length=1)
    foreign_keys: List[ForeignKey] = Field(default_factory=list)
    indexes: List[Index] = Field(default_factory=list)
    comment: Optional[str] = Field(
        default=None,
        description="Table-level comment emitted in DDL and Prisma schema.",
    )

    @model_validator(mode="after")
    def validate_table_integrity(self) -> Table:
        col_names = {c.name for c in self.columns}

        # ── Rule 1: Every table must have at least one PK column ─────────────
        pk_cols = [c for c in self.columns if c.is_primary_key]
        if not pk_cols:
            raise ValueError(
                f"Table '{self.name}' has no primary key column. "
                "Every table must declare at least one column with is_primary_key=true."
            )

        # ── Rule 2: No duplicate column names ────────────────────────────────
        seen: set[str] = set()
        for col in self.columns:
            if col.name in seen:
                raise ValueError(
                    f"Table '{self.name}' declares duplicate column '{col.name}'."
                )
            seen.add(col.name)

        # ── Rule 3: FK source columns must exist in this table ───────────────
        for fk in self.foreign_keys:
            for col in fk.columns:
                if col not in col_names:
                    raise ValueError(
                        f"Table '{self.name}': FK source column '{col}' "
                        "does not exist in the column list."
                    )

        # ── Rule 4: Index columns must exist in this table ───────────────────
        for idx in self.indexes:
            for col in idx.columns:
                if col not in col_names:
                    raise ValueError(
                        f"Table '{self.name}': Index '{idx.name}' references "
                        f"column '{col}' which does not exist."
                    )

        return self


# ============================================================================
# Relationship  (ERD canvas edge descriptor)
# ============================================================================


class Relationship(BaseModel):
    """
    A high-level relationship record used exclusively by the React Flow
    canvas to render directed edges with correct cardinality notation.

    This is kept explicit (rather than derived from FK topology) because:
    - Many-to-many relationships are expressed through junction tables; the
      cardinality must be declared, not inferred.
    - Self-referential hierarchies (e.g. category → parent_category) need
      explicit labelling.
    - Edge labels ('places', 'belongs to', 'contains') improve diagram
      readability and are authored by the AI.
    """

    name: Optional[str] = Field(
        default=None,
        description="Unique identifier for this relationship (e.g. 'user_places_orders').",
    )
    from_table: str = Field(
        ...,
        description="The table on the 'many' or 'source' side of the relationship.",
    )
    from_column: str = Field(
        ...,
        description="The FK (or PK) column in from_table that anchors this edge.",
    )
    to_table: str = Field(
        ...,
        description="The table on the 'one' or 'target' side of the relationship.",
    )
    to_column: str = Field(
        ...,
        description="The referenced column in to_table (usually its PK).",
    )
    relationship_type: RelationshipType
    label: Optional[str] = Field(
        default=None,
        description="Human-readable edge label rendered on the ERD canvas.",
    )
    junction_table: Optional[str] = Field(
        default=None,
        description=(
            "Required when relationship_type is MANY_TO_MANY. "
            "Must exactly match the name of the physical junction Table declared "
            "in ERDSchema.tables. That junction table must itself contain two FK "
            "columns pointing back to from_table and to_table respectively."
        ),
    )

    @model_validator(mode="after")
    def many_to_many_requires_junction_table(self) -> Relationship:
        """
        Pure SQL has no native M:N construct — a physical junction table is
        mandatory. Without this check, the SQL generator would receive an
        incomplete schema and produce invalid DDL.
        """
        if (
            self.relationship_type == RelationshipType.MANY_TO_MANY
            and not self.junction_table
        ):
            raise ValueError(
                f"Relationship '{self.name or 'unnamed'}' is MANY_TO_MANY "
                "but 'junction_table' is not set. "
                "Every many-to-many relationship MUST name its physical junction "
                "table so the SQL generator can validate FK coverage."
            )
        return self


# ============================================================================
# EnumDefinition  (schema-level custom types, PostgreSQL CREATE TYPE … AS ENUM)
# ============================================================================


class EnumDefinition(BaseModel):
    """
    A named ENUM type declared at the schema level.

    PostgreSQL: emits  CREATE TYPE <name> AS ENUM (…);
    MySQL:      inline ENUM(…) per column (this record is informational only).
    SQLite:     no native enum; generator adds a CHECK constraint instead.
    """

    name: str = Field(
        ...,
        description="Enum type name in snake_case, e.g. 'order_status', 'user_role'.",
    )
    values: List[str] = Field(..., min_length=1)
    comment: Optional[str] = None


# ============================================================================
# DB-Type Compatibility Map
# ============================================================================

# Maps each DBTarget to the set of DataTypes it does NOT support natively.
# Consumed in two places:
#   1. ERDSchema.validate_schema_integrity — raises ValueError on mismatch so
#      the problem is caught at parse time, not buried in generator code.
#   2. Phase 2 SQL/Prisma generator switch-statements — use this as the
#      authoritative fallback reference when translating types.
#
# Fallback rules (implemented in Phase 2 generators):
#   JSONB        → JSON (MySQL) / TEXT (SQLite)
#   TIMESTAMPTZ  → DATETIME (MySQL) / TEXT or INTEGER-epoch (SQLite)
#   INTERVAL     → INT seconds (MySQL/SQLite) — with a column comment
#   UUID         → VARCHAR(36) (MySQL) / TEXT (SQLite)
#   BYTEA        → BLOB (MySQL/SQLite)
#   BOOLEAN      → TINYINT(1) (MySQL) / INTEGER 0|1 (SQLite)
#   SERIAL       → AUTO_INCREMENT INT (MySQL) / INTEGER AUTOINCREMENT (SQLite)
#   BIGSERIAL    → BIGINT AUTO_INCREMENT (MySQL) / INTEGER AUTOINCREMENT (SQLite)
#   ENUM         → inline ENUM(...) per column (MySQL) / TEXT + CHECK (SQLite)
_DB_TYPE_INCOMPATIBILITIES: Dict[DBTarget, set] = {
    DBTarget.POSTGRESQL: set(),  # PostgreSQL supports every declared DataType
    DBTarget.MYSQL: {
        DataType.JSONB,          # → JSON
        DataType.TIMESTAMPTZ,    # → DATETIME
        DataType.INTERVAL,       # → INT (seconds) + comment
        DataType.BYTEA,          # → BLOB
        DataType.SERIAL,         # → AUTO_INCREMENT
        DataType.BIGSERIAL,      # → BIGINT AUTO_INCREMENT
    },
    DBTarget.SQLITE: {
        DataType.JSONB,          # → TEXT
        DataType.TIMESTAMPTZ,    # → TEXT or INTEGER (Unix epoch)
        DataType.INTERVAL,       # → INTEGER (seconds)
        DataType.UUID,           # → TEXT
        DataType.BYTEA,          # → BLOB
        DataType.BOOLEAN,        # → INTEGER (0 / 1)
        DataType.SERIAL,         # → INTEGER AUTOINCREMENT
        DataType.BIGSERIAL,      # → INTEGER AUTOINCREMENT
        DataType.ENUM,           # → TEXT + CHECK constraint
    },
}


# ============================================================================
# ERDSchema — top-level data contract
# ============================================================================


class ERDSchema(BaseModel):
    """
    The complete, validated representation of a database schema.

    This is THE canonical object that flows through the entire system:

        Groq Llama 3 (JSON output)
            → Pydantic validation (this model)
                → SQL / Prisma / DBML / Migration generators
                    → React Flow canvas (serialised to JSON)

    Fields annotated with `exclude=True` are set by the backend layer
    and are never expected in the AI's JSON output.
    """

    schema_version: str = Field(
        default="1.0.0",
        description=(
            "Data-contract version. Increment the minor version for additive "
            "changes; the major version for breaking changes."
        ),
    )
    db_target: DBTarget = Field(
        ...,
        description="The database engine the generated DDL targets.",
    )
    schema_name: str = Field(
        default="public",
        description=(
            "Logical schema namespace. Meaningful for PostgreSQL "
            "(maps to the CREATE SCHEMA name). Ignored for MySQL/SQLite."
        ),
    )
    title: Optional[str] = Field(
        default=None,
        description="Display title for the diagram, e.g. 'E-Commerce Platform DB'.",
    )
    description: Optional[str] = Field(
        default=None,
        description="Free-text summary of what this schema models.",
    )

    tables: List[Table] = Field(
        ...,
        min_length=1,
        description="Every table in the schema. Must contain at least one entry.",
    )
    relationships: List[Relationship] = Field(
        default_factory=list,
        description=(
            "Explicit relationship descriptors for ERD edge rendering. "
            "One entry per FK (or logical M:N link). "
            "Cardinality must be set correctly — it drives React Flow edge markers."
        ),
    )
    enums: List[EnumDefinition] = Field(
        default_factory=list,
        description=(
            "Global enum type definitions. "
            "Required for PostgreSQL (CREATE TYPE). "
            "Optional but helpful for MySQL/SQLite generators."
        ),
    )

    # ── Backend-only metadata (excluded from AI output schema) ───────────────
    generated_at: Optional[datetime] = Field(
        default=None,
        exclude=True,
        description="UTC timestamp set by the backend when the schema is created.",
    )
    prompt_hash: Optional[str] = Field(
        default=None,
        exclude=True,
        description=(
            "SHA-256 hex digest of the original user prompt. "
            "Used as the Redis cache key to skip duplicate AI calls."
        ),
    )

    # ── Schema-level validators ───────────────────────────────────────────────

    @model_validator(mode="after")
    def validate_schema_integrity(self) -> ERDSchema:
        table_names = {t.name for t in self.tables}
        table_col_map: Dict[str, set[str]] = {
            t.name: {c.name for c in t.columns} for t in self.tables
        }

        # ── Rule 1: No duplicate table names ─────────────────────────────────
        seen: set[str] = set()
        for t in self.tables:
            if t.name in seen:
                raise ValueError(f"Duplicate table name '{t.name}' in schema.")
            seen.add(t.name)

        # ── Rule 2: FK referenced tables must exist in this schema ────────────
        for table in self.tables:
            for fk in table.foreign_keys:
                if fk.referenced_table not in table_names:
                    raise ValueError(
                        f"Table '{table.name}': FK references unknown table "
                        f"'{fk.referenced_table}'. "
                        "All referenced tables must be declared in this schema."
                    )
                # Also validate that referenced columns exist in target table
                target_cols = table_col_map[fk.referenced_table]
                for ref_col in fk.referenced_columns:
                    if ref_col not in target_cols:
                        raise ValueError(
                            f"Table '{table.name}': FK targets column "
                            f"'{ref_col}' which does not exist in "
                            f"'{fk.referenced_table}'."
                        )

        # ── Rule 3: Relationship tables and columns must exist ─────────────────
        for rel in self.relationships:
            for tname, cname in (
                (rel.from_table, rel.from_column),
                (rel.to_table, rel.to_column),
            ):
                if tname not in table_names:
                    raise ValueError(
                        f"Relationship '{rel.name or 'unnamed'}' references "
                        f"unknown table '{tname}'."
                    )
                if cname not in table_col_map[tname]:
                    raise ValueError(
                        f"Relationship '{rel.name or 'unnamed'}': column "
                        f"'{cname}' does not exist in table '{tname}'."
                    )

        # ── Rule 4: Enum columns must have either inline values or a matching
        #            global EnumDefinition ────────────────────────────────────
        declared_enums = {e.name for e in self.enums}
        for table in self.tables:
            for col in table.columns:
                if col.data_type == DataType.ENUM:
                    # Inline enum_values are sufficient (already validated on Column).
                    # If the column has no inline values, a matching global enum must exist.
                    if col.enum_values is None and col.name not in declared_enums:
                        raise ValueError(
                            f"Table '{table.name}', column '{col.name}': "
                            "ENUM column has no inline enum_values and no "
                            "matching global EnumDefinition was found."
                        )

        # ── Rule 5: Every MANY_TO_MANY relationship must have a physical
        #            junction table declared in this schema ───────────────────
        for rel in self.relationships:
            if rel.relationship_type == RelationshipType.MANY_TO_MANY:
                # junction_table presence is already enforced on Relationship itself;
                # here we verify the named table actually exists in the schema.
                if rel.junction_table not in table_names:
                    raise ValueError(
                        f"Relationship '{rel.name or 'unnamed'}' declares "
                        f"junction_table='{rel.junction_table}' but no table "
                        "with that name exists in ERDSchema.tables. "
                        "Add the physical junction table to the tables array."
                    )
                # Verify the junction table has FKs pointing to BOTH sides
                jt = next(t for t in self.tables if t.name == rel.junction_table)
                jt_fk_targets = {fk.referenced_table for fk in jt.foreign_keys}
                missing = {rel.from_table, rel.to_table} - jt_fk_targets
                if missing:
                    raise ValueError(
                        f"Junction table '{rel.junction_table}' is missing FK(s) "
                        f"pointing to: {missing}. "
                        "A junction table must have foreign keys to BOTH sides "
                        "of the many-to-many relationship."
                    )

        # ── Rule 6: Detect DataType / DBTarget incompatibilities ──────────────
        incompatible = _DB_TYPE_INCOMPATIBILITIES.get(self.db_target, set())
        if incompatible:
            offenders: list[str] = []
            for table in self.tables:
                for col in table.columns:
                    if col.data_type in incompatible:
                        offenders.append(
                            f"{table.name}.{col.name} ({col.data_type.value})"
                        )
            if offenders:
                raise ValueError(
                    f"The following columns use types not natively supported by "
                    f"{self.db_target.value}:\n"
                    + "\n".join(f"  • {o}" for o in offenders)
                    + "\nUse a compatible type, or let the Phase 2 generator "
                    "apply the documented fallback mapping."
                )

        return self


# ============================================================================
# LLMRetryContext  — Phase 2 automated self-healing loop
# ============================================================================

# PHASE 2 IMPLEMENTATION NOTE ─────────────────────────────────────────────────
#
# The FastAPI /generate endpoint MUST wrap ERDSchema(**llm_json) in a
# try/except block as follows:
#
#   MAX_RETRIES = 2
#   for attempt in range(MAX_RETRIES + 1):
#       try:
#           schema = ERDSchema(**llm_output)
#           break                            # validation passed → exit loop
#       except ValidationError as exc:
#           if attempt == MAX_RETRIES:
#               raise HTTPException(422, detail=str(exc))
#           retry_ctx = LLMRetryContext.from_validation_error(
#               original_prompt, llm_output, exc
#           )
#           llm_output = call_llm(retry_ctx.to_repair_prompt())
#
# This converts a hard 422 into a silent self-correction for single-typo
# mistakes (e.g. LLM writes "ordr" instead of "order" in a FK reference).
# The structured error message tells the LLM exactly which field failed and why,
# so the repair prompt is precise rather than asking it to "try again".
# ─────────────────────────────────────────────────────────────────────────────


class LLMRetryContext(BaseModel):
    """
    Structured payload used by the Phase 2 /generate endpoint to feed a
    Pydantic ValidationError back to the LLM for automated self-correction.

    Usage
    -----
    Build from a caught ValidationError, then call `to_repair_prompt()` to
    get the string that is prepended to the original prompt on the retry call.
    """

    original_prompt: str = Field(..., description="The user's original plain-English input.")
    failed_output: Dict[str, Any] = Field(
        ..., description="The raw JSON dict that the LLM produced and that failed validation."
    )
    error_summary: str = Field(
        ...,
        description=(
            "Human-readable, LLM-facing description of every validation error. "
            "Formatted as a bullet list so the model can locate each problem quickly."
        ),
    )
    attempt: int = Field(default=1, description="Which retry attempt this is (1-indexed).")

    @classmethod
    def from_validation_error(
        cls,
        original_prompt: str,
        failed_output: Dict[str, Any],
        exc: Exception,
        attempt: int = 1,
    ) -> LLMRetryContext:
        """Build a retry context from a caught Pydantic ValidationError."""
        try:
            # Pydantic v2 ValidationError exposes .errors()
            errors = exc.errors()  # type: ignore[attr-defined]
            lines = [
                f"  • {' → '.join(str(loc) for loc in e['loc'])}: {e['msg']}"
                for e in errors
            ]
        except AttributeError:
            lines = [f"  • {exc}"]

        error_summary = (
            f"Your previous JSON output failed schema validation "
            f"(attempt {attempt}). Fix ONLY the following errors and return "
            "the corrected JSON — do not change anything else:\n"
            + "\n".join(lines)
        )
        return cls(
            original_prompt=original_prompt,
            failed_output=failed_output,
            error_summary=error_summary,
            attempt=attempt,
        )

    def to_repair_prompt(self) -> str:
        """
        Returns the full prompt string to send to the LLM on the retry call.
        The error summary is prepended so it appears in the model's primary
        attention window.
        """
        import json

        return (
            f"{self.error_summary}\n\n"
            f"Original request: {self.original_prompt}\n\n"
            f"Your previous (invalid) output:\n{json.dumps(self.failed_output, indent=2)}"
        )


# ============================================================================
# Convenience alias used by generator modules
# ============================================================================

Schema = ERDSchema  # short alias for import ergonomics
