"""
API request / response models for the /generate, /refine, and /schema routes.

These are separate from erd_schema.py (the data contract) so the HTTP layer
and the AI validation layer stay decoupled.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.erd_schema import DBTarget, ERDSchema


class GenerateRequest(BaseModel):
    prompt: str = Field(
        ...,
        min_length=10,
        description="Plain-English description of the database to generate.",
        examples=["An e-commerce platform with users, products, orders, and reviews."],
    )
    db_target: DBTarget = Field(
        default=DBTarget.POSTGRESQL,
        description="Target database engine for DDL and type compatibility.",
    )


class GenerateResponse(BaseModel):
    schema_id: Optional[str] = Field(
        default=None,
        description="UUID of the saved schema record — used for shareable /schema/:id links.",
    )
    schema: ERDSchema
    sql: str = Field(..., description="CREATE TABLE DDL for the chosen db_target.")
    migration: str = Field(..., description="Transactional migration script.")
    prisma: str = Field(..., description="Prisma schema.prisma file contents.")
    dbml: str = Field(..., description="DBML file contents for dbdiagram.io.")
    cached: bool = Field(default=False, description="True if this response was served from Redis.")


class RefineRequest(BaseModel):
    schema: ERDSchema = Field(..., description="The existing ERD schema to refine.")
    follow_up: str = Field(
        ...,
        min_length=3,
        description="Plain-English description of changes to apply.",
        examples=["Add a reviews table where users can rate products 1-5."],
    )


class SavedSchemaResponse(BaseModel):
    schema_id: str
    schema: ERDSchema
    title: Optional[str] = None
    created_at: datetime
