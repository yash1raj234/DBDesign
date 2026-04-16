"""
Migration File Generator — wraps SQL DDL in a transactional migration script.

The output can be saved directly as a versioned .sql file (e.g. Flyway V1__init.sql
or a plain numbered migration).  The script is idempotent where possible
(CREATE TABLE IF NOT EXISTS for PostgreSQL/SQLite).
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.schemas.erd_schema import DBTarget, ERDSchema
from app.generators.sql import generate_sql


def generate_migration(schema: ERDSchema, version: str | None = None) -> str:
    now = datetime.now(tz=timezone.utc)
    ts = now.strftime("%Y%m%d%H%M%S")
    ver = version or ts
    target = schema.db_target

    ddl = generate_sql(schema)

    header_lines: list[str] = [
        f"-- Migration : V{ver}__initial_schema",
        f"-- Generated : {now.isoformat()}",
        f"-- Target    : {target.value.upper()}",
        f"-- Schema    : {schema.schema_name}",
    ]
    if schema.title:
        header_lines.append(f"-- Title     : {schema.title}")
    header_lines.append(
        "-- WARNING   : Review before running against production."
    )
    header_lines.append("")

    if target == DBTarget.POSTGRESQL:
        body = (
            "BEGIN;\n\n"
            + ddl
            + "\n\nCOMMIT;\n"
        )
    elif target == DBTarget.MYSQL:
        body = (
            "START TRANSACTION;\n\n"
            + ddl
            + "\n\nCOMMIT;\n"
        )
    else:
        # SQLite does not support multi-statement transactions in the same way
        body = (
            "BEGIN TRANSACTION;\n\n"
            + ddl
            + "\n\nCOMMIT;\n"
        )

    return "\n".join(header_lines) + body
