"""
Phase 1 test suite — validates every invariant enforced by the ERD data contract.

Run:  pytest tests/test_erd_schema.py -v
"""

import pytest
from pydantic import ValidationError

from app.schemas.erd_schema import (
    Column,
    DataType,
    DBTarget,
    EnumDefinition,
    ERDSchema,
    FKAction,
    ForeignKey,
    Index,
    IndexType,
    Relationship,
    RelationshipType,
    Table,
)


# ── Helpers ───────────────────────────────────────────────────────────────────


def simple_table(name: str, pk_name: str = "id") -> dict:
    """Minimal valid table dict — one PK integer column."""
    return {
        "name": name,
        "columns": [
            {
                "name": pk_name,
                "data_type": "INTEGER",
                "is_primary_key": True,
                "is_nullable": False,
            }
        ],
    }


def simple_schema(*table_names: str, db_target: str = "postgresql") -> dict:
    """Minimal valid ERDSchema dict with N tables, no relationships."""
    return {
        "db_target": db_target,
        "tables": [simple_table(n) for n in table_names],
    }


# ── Column ────────────────────────────────────────────────────────────────────


class TestColumn:
    def test_pk_is_forced_not_null(self):
        col = Column(
            name="id", data_type=DataType.INTEGER, is_primary_key=True, is_nullable=True
        )
        assert col.is_nullable is False

    def test_enum_requires_values(self):
        with pytest.raises(ValidationError, match="enum_values"):
            Column(name="status", data_type=DataType.ENUM)

    def test_enum_values_on_non_enum_raises(self):
        with pytest.raises(ValidationError, match="enum_values"):
            Column(
                name="status",
                data_type=DataType.TEXT,
                enum_values=["a", "b"],
            )

    def test_varchar_type_params_requires_length(self):
        with pytest.raises(ValidationError, match="length"):
            Column(name="name", data_type=DataType.VARCHAR, type_params={"size": 255})

    def test_decimal_requires_precision_and_scale(self):
        with pytest.raises(ValidationError, match="precision"):
            Column(name="price", data_type=DataType.DECIMAL, type_params={"precision": 10})

    def test_valid_varchar(self):
        col = Column(name="email", data_type=DataType.VARCHAR, type_params={"length": 255})
        assert col.type_params == {"length": 255}

    def test_valid_enum(self):
        col = Column(
            name="status",
            data_type=DataType.ENUM,
            enum_values=["pending", "active", "cancelled"],
        )
        assert len(col.enum_values) == 3


# ── ForeignKey ────────────────────────────────────────────────────────────────


class TestForeignKey:
    def test_arity_mismatch_raises(self):
        with pytest.raises(ValidationError, match="same length"):
            ForeignKey(
                columns=["user_id"],
                referenced_table="user",
                referenced_columns=["id", "email"],
            )

    def test_valid_composite_fk(self):
        fk = ForeignKey(
            columns=["order_id", "product_id"],
            referenced_table="order_product",
            referenced_columns=["order_id", "product_id"],
        )
        assert len(fk.columns) == 2


# ── Table ─────────────────────────────────────────────────────────────────────


class TestTable:
    def test_no_pk_raises(self):
        with pytest.raises(ValidationError, match="primary key"):
            Table(name="bad", columns=[Column(name="name", data_type=DataType.TEXT)])

    def test_duplicate_column_names_raise(self):
        with pytest.raises(ValidationError, match="duplicate"):
            Table(
                name="bad",
                columns=[
                    Column(name="id", data_type=DataType.INTEGER, is_primary_key=True),
                    Column(name="id", data_type=DataType.TEXT),
                ],
            )

    def test_fk_references_nonexistent_column(self):
        with pytest.raises(ValidationError, match="does not exist"):
            Table(
                name="order",
                columns=[
                    Column(name="id", data_type=DataType.INTEGER, is_primary_key=True)
                ],
                foreign_keys=[
                    ForeignKey(
                        columns=["ghost_col"],
                        referenced_table="user",
                        referenced_columns=["id"],
                    )
                ],
            )

    def test_index_references_nonexistent_column(self):
        with pytest.raises(ValidationError, match="does not exist"):
            Table(
                name="user",
                columns=[
                    Column(name="id", data_type=DataType.INTEGER, is_primary_key=True)
                ],
                indexes=[Index(name="idx_user_email", columns=["email"])],
            )


# ── ERDSchema ─────────────────────────────────────────────────────────────────


class TestERDSchema:
    def test_minimal_valid_schema(self):
        schema = ERDSchema(**simple_schema("user"))
        assert len(schema.tables) == 1

    def test_duplicate_table_names_raise(self):
        with pytest.raises(ValidationError, match="Duplicate table"):
            ERDSchema(**simple_schema("user", "user"))

    def test_fk_to_unknown_table_raises(self):
        with pytest.raises(ValidationError, match="unknown table"):
            ERDSchema(
                db_target=DBTarget.POSTGRESQL,
                tables=[
                    Table(
                        name="post",
                        columns=[
                            Column(name="id", data_type=DataType.INTEGER, is_primary_key=True),
                            Column(name="user_id", data_type=DataType.INTEGER),
                        ],
                        foreign_keys=[
                            ForeignKey(
                                columns=["user_id"],
                                referenced_table="ghost_table",
                                referenced_columns=["id"],
                            )
                        ],
                    )
                ],
            )

    def test_fk_to_unknown_column_raises(self):
        with pytest.raises(ValidationError, match="does not exist"):
            ERDSchema(
                db_target=DBTarget.POSTGRESQL,
                tables=[
                    Table(**simple_table("user")),
                    Table(
                        name="post",
                        columns=[
                            Column(name="id", data_type=DataType.INTEGER, is_primary_key=True),
                            Column(name="user_id", data_type=DataType.INTEGER),
                        ],
                        foreign_keys=[
                            ForeignKey(
                                columns=["user_id"],
                                referenced_table="user",
                                referenced_columns=["nonexistent_col"],
                            )
                        ],
                    ),
                ],
            )

    def test_relationship_unknown_table_raises(self):
        with pytest.raises(ValidationError, match="unknown table"):
            ERDSchema(
                db_target=DBTarget.POSTGRESQL,
                tables=[Table(**simple_table("user"))],
                relationships=[
                    Relationship(
                        from_table="user",
                        from_column="id",
                        to_table="ghost_table",
                        to_column="id",
                        relationship_type=RelationshipType.ONE_TO_MANY,
                    )
                ],
            )

    # ── Many-to-Many ──────────────────────────────────────────────────────────

    def test_many_to_many_without_junction_table_field_raises(self):
        with pytest.raises(ValidationError, match="junction_table"):
            Relationship(
                from_table="student",
                from_column="id",
                to_table="course",
                to_column="id",
                relationship_type=RelationshipType.MANY_TO_MANY,
                # junction_table intentionally omitted
            )

    def test_many_to_many_junction_table_not_in_schema_raises(self):
        with pytest.raises(ValidationError, match="junction_table"):
            ERDSchema(
                db_target=DBTarget.POSTGRESQL,
                tables=[Table(**simple_table("student")), Table(**simple_table("course"))],
                relationships=[
                    Relationship(
                        from_table="student",
                        from_column="id",
                        to_table="course",
                        to_column="id",
                        relationship_type=RelationshipType.MANY_TO_MANY,
                        junction_table="student_course",  # not in tables!
                    )
                ],
            )

    def test_many_to_many_junction_table_missing_fk_raises(self):
        """Junction table exists but is missing one of the two required FKs."""
        with pytest.raises(ValidationError, match="missing FK"):
            ERDSchema(
                db_target=DBTarget.POSTGRESQL,
                tables=[
                    Table(**simple_table("student")),
                    Table(**simple_table("course")),
                    Table(
                        name="student_course",
                        columns=[
                            Column(name="id", data_type=DataType.INTEGER, is_primary_key=True),
                            Column(name="student_id", data_type=DataType.INTEGER),
                        ],
                        foreign_keys=[
                            ForeignKey(
                                columns=["student_id"],
                                referenced_table="student",
                                referenced_columns=["id"],
                            )
                            # FK to "course" intentionally omitted
                        ],
                    ),
                ],
                relationships=[
                    Relationship(
                        from_table="student",
                        from_column="id",
                        to_table="course",
                        to_column="id",
                        relationship_type=RelationshipType.MANY_TO_MANY,
                        junction_table="student_course",
                    )
                ],
            )

    def test_valid_many_to_many(self):
        schema = ERDSchema(
            db_target=DBTarget.POSTGRESQL,
            tables=[
                Table(**simple_table("student")),
                Table(**simple_table("course")),
                Table(
                    name="student_course",
                    columns=[
                        Column(name="student_id", data_type=DataType.INTEGER, is_primary_key=True),
                        Column(name="course_id", data_type=DataType.INTEGER, is_primary_key=True),
                    ],
                    foreign_keys=[
                        ForeignKey(
                            columns=["student_id"],
                            referenced_table="student",
                            referenced_columns=["id"],
                        ),
                        ForeignKey(
                            columns=["course_id"],
                            referenced_table="course",
                            referenced_columns=["id"],
                        ),
                    ],
                ),
            ],
            relationships=[
                Relationship(
                    from_table="student",
                    from_column="id",
                    to_table="course",
                    to_column="id",
                    relationship_type=RelationshipType.MANY_TO_MANY,
                    junction_table="student_course",
                )
            ],
        )
        assert len(schema.tables) == 3

    # ── DB Type Compatibility ─────────────────────────────────────────────────

    def test_jsonb_on_sqlite_raises(self):
        with pytest.raises(ValidationError, match="not natively supported"):
            ERDSchema(
                db_target=DBTarget.SQLITE,
                tables=[
                    Table(
                        name="event",
                        columns=[
                            Column(name="id", data_type=DataType.INTEGER, is_primary_key=True),
                            Column(name="payload", data_type=DataType.JSONB),
                        ],
                    )
                ],
            )

    def test_jsonb_on_mysql_raises(self):
        with pytest.raises(ValidationError, match="not natively supported"):
            ERDSchema(
                db_target=DBTarget.MYSQL,
                tables=[
                    Table(
                        name="event",
                        columns=[
                            Column(name="id", data_type=DataType.INTEGER, is_primary_key=True),
                            Column(name="payload", data_type=DataType.JSONB),
                        ],
                    )
                ],
            )

    def test_jsonb_on_postgresql_passes(self):
        schema = ERDSchema(
            db_target=DBTarget.POSTGRESQL,
            tables=[
                Table(
                    name="event",
                    columns=[
                        Column(name="id", data_type=DataType.INTEGER, is_primary_key=True),
                        Column(name="payload", data_type=DataType.JSONB),
                    ],
                )
            ],
        )
        assert schema.tables[0].columns[1].data_type == DataType.JSONB
