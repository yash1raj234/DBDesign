"""
SQL DDL Generator — ERDSchema → CREATE TABLE statements.

Output order:
  1. CREATE SCHEMA (PostgreSQL, non-public)
  2. CREATE TYPE … AS ENUM  (PostgreSQL enums)
  3. CREATE TABLE (topological order — dependencies first, FKs omitted inline)
  4. ALTER TABLE ADD CONSTRAINT  (FKs added after all tables exist)
  5. CREATE [UNIQUE] INDEX
"""

from __future__ import annotations

from collections import deque
from typing import List

from app.schemas.erd_schema import (
    Column,
    DataType,
    DBTarget,
    ERDSchema,
    FKAction,
    Table,
)


# ── Type mapping ──────────────────────────────────────────────────────────────


def _col_sql_type(col: Column, target: DBTarget) -> str:
    """Translate a Column's DataType to the SQL type string for target DB."""
    dt = col.data_type
    tp = col.type_params or {}

    if target == DBTarget.POSTGRESQL:
        if col.is_auto_increment and dt not in (DataType.SERIAL, DataType.BIGSERIAL):
            return "BIGSERIAL" if dt == DataType.BIGINT else "SERIAL"
        _MAP: dict[DataType, str] = {
            DataType.SMALLINT:   "SMALLINT",
            DataType.INTEGER:    "INTEGER",
            DataType.BIGINT:     "BIGINT",
            DataType.REAL:       "REAL",
            DataType.FLOAT:      "FLOAT",
            DataType.DOUBLE:     "DOUBLE PRECISION",
            DataType.SERIAL:     "SERIAL",
            DataType.BIGSERIAL:  "BIGSERIAL",
            DataType.CHAR:       f"CHAR({tp.get('length', 1)})",
            DataType.VARCHAR:    f"VARCHAR({tp.get('length', 255)})",
            DataType.TEXT:       "TEXT",
            DataType.DATE:       "DATE",
            DataType.TIME:       "TIME",
            DataType.TIMESTAMP:  "TIMESTAMP",
            DataType.TIMESTAMPTZ: "TIMESTAMPTZ",
            DataType.INTERVAL:   "INTERVAL",
            DataType.BOOLEAN:    "BOOLEAN",
            DataType.BYTEA:      "BYTEA",
            DataType.BLOB:       "BYTEA",
            DataType.JSON:       "JSON",
            DataType.JSONB:      "JSONB",
            DataType.UUID:       "UUID",
        }
        if dt == DataType.DECIMAL:
            return f"DECIMAL({tp.get('precision', 10)}, {tp.get('scale', 2)})"
        if dt == DataType.NUMERIC:
            return f"NUMERIC({tp.get('precision', 10)}, {tp.get('scale', 2)})"
        if dt == DataType.ENUM:
            return f"{col.name}_type"  # references a CREATE TYPE above
        return _MAP.get(dt, dt.value)

    if target == DBTarget.MYSQL:
        if col.is_auto_increment:
            return "BIGINT" if dt in (DataType.BIGINT, DataType.BIGSERIAL) else "INT"
        if dt == DataType.ENUM:
            vals = ", ".join(f"'{v}'" for v in (col.enum_values or []))
            return f"ENUM({vals})"
        _MAP = {
            DataType.SMALLINT:   "SMALLINT",
            DataType.INTEGER:    "INT",
            DataType.BIGINT:     "BIGINT",
            DataType.SERIAL:     "INT",
            DataType.BIGSERIAL:  "BIGINT",
            DataType.REAL:       "FLOAT",
            DataType.FLOAT:      "FLOAT",
            DataType.DOUBLE:     "DOUBLE",
            DataType.CHAR:       f"CHAR({tp.get('length', 1)})",
            DataType.VARCHAR:    f"VARCHAR({tp.get('length', 255)})",
            DataType.TEXT:       "TEXT",
            DataType.DATE:       "DATE",
            DataType.TIME:       "TIME",
            DataType.TIMESTAMP:  "DATETIME",
            DataType.TIMESTAMPTZ: "DATETIME",
            DataType.INTERVAL:   "INT",
            DataType.BOOLEAN:    "TINYINT(1)",
            DataType.BYTEA:      "BLOB",
            DataType.BLOB:       "BLOB",
            DataType.JSON:       "JSON",
            DataType.JSONB:      "JSON",
            DataType.UUID:       "VARCHAR(36)",
        }
        if dt == DataType.DECIMAL:
            return f"DECIMAL({tp.get('precision', 10)}, {tp.get('scale', 2)})"
        if dt == DataType.NUMERIC:
            return f"NUMERIC({tp.get('precision', 10)}, {tp.get('scale', 2)})"
        return _MAP.get(dt, dt.value)

    # SQLite
    INTEGER_TYPES = {
        DataType.SMALLINT, DataType.INTEGER, DataType.BIGINT,
        DataType.SERIAL,   DataType.BIGSERIAL,
    }
    if col.is_auto_increment or dt in INTEGER_TYPES:
        return "INTEGER"
    if dt in (DataType.REAL, DataType.FLOAT, DataType.DOUBLE):
        return "REAL"
    if dt in (DataType.DECIMAL, DataType.NUMERIC):
        return "NUMERIC"
    if dt in (DataType.CHAR, DataType.VARCHAR, DataType.TEXT,
              DataType.UUID, DataType.TIMESTAMPTZ, DataType.ENUM,
              DataType.TIMESTAMP, DataType.INTERVAL):
        return "TEXT"
    if dt in (DataType.DATE,):
        return "DATE"
    if dt in (DataType.TIME,):
        return "TIME"
    if dt == DataType.BOOLEAN:
        return "INTEGER"  # 0 / 1
    if dt in (DataType.BYTEA, DataType.BLOB):
        return "BLOB"
    if dt in (DataType.JSON, DataType.JSONB):
        return "TEXT"
    return dt.value


def _fk_action(action: FKAction) -> str:
    return action.value.replace("_", " ")


# ── Topological sort ──────────────────────────────────────────────────────────


def _topological_sort(tables: List[Table]) -> List[Table]:
    """
    Return tables in dependency order so that referenced tables are emitted
    before the tables that reference them.  Self-referential FKs are ignored
    for ordering purposes (they can't be satisfied at CREATE time anyway).
    """
    name_to_table: dict[str, Table] = {t.name: t for t in tables}

    # deps[A] = set of table names that A depends on (A has FK → dep)
    deps: dict[str, set[str]] = {t.name: set() for t in tables}
    for t in tables:
        for fk in t.foreign_keys:
            if fk.referenced_table != t.name:
                deps[t.name].add(fk.referenced_table)

    # Kahn's BFS
    dependents: dict[str, list[str]] = {t.name: [] for t in tables}
    in_deg: dict[str, int] = {t.name: 0 for t in tables}
    for t_name, t_deps in deps.items():
        for dep in t_deps:
            if dep in dependents:
                dependents[dep].append(t_name)
                in_deg[t_name] += 1

    queue: deque[Table] = deque(
        t for t in tables if in_deg[t.name] == 0
    )
    result: list[Table] = []

    while queue:
        t = queue.popleft()
        result.append(t)
        for dep_name in dependents[t.name]:
            in_deg[dep_name] -= 1
            if in_deg[dep_name] == 0:
                queue.append(name_to_table[dep_name])

    # Append remaining (cycles — shouldn't occur in valid schemas)
    emitted = {t.name for t in result}
    result.extend(t for t in tables if t.name not in emitted)
    return result


# ── Column rendering ──────────────────────────────────────────────────────────


def _render_column(col: Column, target: DBTarget) -> str:
    parts: list[str] = [f"    {col.name}", _col_sql_type(col, target)]

    if not col.is_nullable and not col.is_primary_key:
        parts.append("NOT NULL")

    if col.is_unique and not col.is_primary_key:
        parts.append("UNIQUE")

    if col.is_auto_increment:
        if target == DBTarget.SQLITE:
            parts.append("AUTOINCREMENT")
        elif target == DBTarget.MYSQL:
            parts.append("AUTO_INCREMENT")
        # PostgreSQL: SERIAL/BIGSERIAL already encodes auto-increment

    if col.default_value is not None and not col.is_auto_increment:
        parts.append(f"DEFAULT {col.default_value}")

    if col.check_constraint:
        parts.append(f"CHECK ({col.check_constraint})")

    return " ".join(parts)


# ── Public entry point ────────────────────────────────────────────────────────


def generate_sql(schema: ERDSchema) -> str:
    target = schema.db_target
    out: list[str] = []

    out.append("-- Generated by DBDesign Platform")
    out.append(f"-- Target : {target.value.upper()}")
    out.append(f"-- Schema : {schema.schema_name}")
    if schema.title:
        out.append(f"-- Title  : {schema.title}")
    out.append("")

    # ── PostgreSQL prelude ────────────────────────────────────────────────────
    if target == DBTarget.POSTGRESQL:
        if schema.schema_name and schema.schema_name != "public":
            out.append(f"CREATE SCHEMA IF NOT EXISTS {schema.schema_name};")
            out.append(f"SET search_path TO {schema.schema_name}, public;")
            out.append("")
        if schema.enums:
            for e in schema.enums:
                vals = ", ".join(f"'{v}'" for v in e.values)
                out.append(f"CREATE TYPE {e.name} AS ENUM ({vals});")
            out.append("")

    # ── MySQL prelude ─────────────────────────────────────────────────────────
    if target == DBTarget.MYSQL:
        out.append("SET FOREIGN_KEY_CHECKS = 0;")
        out.append("")

    # ── CREATE TABLE (topological order) ─────────────────────────────────────
    for table in _topological_sort(schema.tables):
        pk_cols = [c for c in table.columns if c.is_primary_key]
        col_defs: list[str] = [_render_column(c, target) for c in table.columns]

        if len(pk_cols) == 1 and not pk_cols[0].is_auto_increment:
            col_defs.append(f"    PRIMARY KEY ({pk_cols[0].name})")
        elif len(pk_cols) > 1:
            pk_list = ", ".join(c.name for c in pk_cols)
            col_defs.append(f"    PRIMARY KEY ({pk_list})")
        elif len(pk_cols) == 1:
            col_defs.append(f"    PRIMARY KEY ({pk_cols[0].name})")

        out.append(f"CREATE TABLE {table.name} (")
        out.append(",\n".join(col_defs))
        if target == DBTarget.MYSQL:
            out.append(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;")
        else:
            out.append(");")

        # PostgreSQL table / column comments
        if target == DBTarget.POSTGRESQL:
            if table.comment:
                out.append(
                    f"COMMENT ON TABLE {table.name} IS '{table.comment}';"
                )
            for c in table.columns:
                if c.comment:
                    out.append(
                        f"COMMENT ON COLUMN {table.name}.{c.name} IS '{c.comment}';"
                    )
        out.append("")

    # ── ALTER TABLE ADD CONSTRAINT (foreign keys) ─────────────────────────────
    fk_lines: list[str] = []
    for table in schema.tables:
        for fk in table.foreign_keys:
            name = fk.constraint_name or f"fk_{table.name}_{'_'.join(fk.columns)}"
            src = ", ".join(fk.columns)
            ref = ", ".join(fk.referenced_columns)
            fk_lines.append(
                f"ALTER TABLE {table.name}\n"
                f"    ADD CONSTRAINT {name}\n"
                f"    FOREIGN KEY ({src})\n"
                f"    REFERENCES {fk.referenced_table} ({ref})\n"
                f"    ON DELETE {_fk_action(fk.on_delete)}\n"
                f"    ON UPDATE {_fk_action(fk.on_update)};"
            )

    if fk_lines:
        out.append("-- Foreign key constraints")
        out.extend(fk_lines)
        out.append("")

    # ── CREATE INDEX ──────────────────────────────────────────────────────────
    idx_lines: list[str] = []
    for table in schema.tables:
        for idx in table.indexes:
            unique = "UNIQUE " if idx.is_unique else ""
            cols = ", ".join(idx.columns)
            using = ""
            if target == DBTarget.POSTGRESQL and idx.index_type.value != "BTREE":
                using = f" USING {idx.index_type.value}"
            stmt = f"CREATE {unique}INDEX {idx.name} ON {table.name}{using} ({cols})"
            if idx.where_clause and target == DBTarget.POSTGRESQL:
                stmt += f" WHERE {idx.where_clause}"
            idx_lines.append(stmt + ";")

    if idx_lines:
        out.extend(idx_lines)
        out.append("")

    # ── MySQL epilogue ────────────────────────────────────────────────────────
    if target == DBTarget.MYSQL:
        out.append("SET FOREIGN_KEY_CHECKS = 1;")

    return "\n".join(out)
