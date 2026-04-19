"""
Generate router — the core API surface.

POST /api/v1/generate    text + db_target → ERDSchema + SQL + migration + Prisma + DBML
POST /api/v1/refine      existing schema + follow-up → updated schema (all outputs)
GET  /api/v1/schema/:id  load a previously saved diagram by share ID
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_llm_service
from app.generators.dbml import generate_dbml
from app.generators.migration import generate_migration
from app.generators.prisma import generate_prisma
from app.generators.sql import generate_sql
from app.schemas.api import (
    GenerateRequest,
    GenerateResponse,
    RefineRequest,
    SavedSchemaResponse,
)
from app.services.groq_service import GroqService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["generate"])


# ── Helper: run all generators ────────────────────────────────────────────────


def _run_generators(schema):
    return {
        "sql":       generate_sql(schema),
        "migration": generate_migration(schema),
        "prisma":    generate_prisma(schema),
        "dbml":      generate_dbml(schema),
    }


# ── POST /generate ────────────────────────────────────────────────────────────


@router.post(
    "/generate",
    response_model=GenerateResponse,
    summary="Convert plain English to ERD schema + all output formats",
)
async def generate(
    body: GenerateRequest,
    llm: Annotated[GroqService, Depends(get_llm_service)],
) -> GenerateResponse:
    try:
        schema, cached = await llm.generate(body.prompt, body.db_target)
    except ValueError as exc:
        logger.error("Groq generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    outputs = _run_generators(schema)

    return GenerateResponse(
        schema=schema,
        cached=cached,
        **outputs,
    )


# ── POST /refine ──────────────────────────────────────────────────────────────


@router.post(
    "/refine",
    response_model=GenerateResponse,
    summary="Apply a follow-up instruction to an existing ERD schema",
)
async def refine(
    body: RefineRequest,
    llm: Annotated[GroqService, Depends(get_llm_service)],
) -> GenerateResponse:
    try:
        schema = await llm.refine(body.schema, body.follow_up)
    except ValueError as exc:
        logger.error("Groq refinement failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    outputs = _run_generators(schema)

    return GenerateResponse(
        schema=schema,
        cached=False,
        **outputs,
    )


# ── GET /schema/:id ───────────────────────────────────────────────────────────


@router.get(
    "/schema/{schema_id}",
    response_model=SavedSchemaResponse,
    summary="Load a saved diagram by share ID",
)
async def get_schema(schema_id: str) -> SavedSchemaResponse:
    # Phase 4: query the saved_schemas PostgreSQL table
    # For now, return 404 to signal the feature is not yet wired.
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Schema '{schema_id}' not found. Save/load wired in Phase 4.",
    )
