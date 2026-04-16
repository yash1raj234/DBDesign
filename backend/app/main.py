"""
FastAPI application factory.

Startup / shutdown lifecycle:
  - Creates the Redis connection pool and stores it on app.state.
  - Creates the GeminiService singleton (with the Redis pool) on app.state.
  - Cleans up on shutdown.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.dependencies import get_redis_pool
from app.routers.generate import router as generate_router
from app.services.gemini import GeminiService


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # ── Startup ───────────────────────────────────────────────────────────────
    pool = get_redis_pool()
    app.state.redis_pool = pool

    redis_client: aioredis.Redis = aioredis.Redis(connection_pool=pool)
    app.state.gemini_service = GeminiService(redis_client=redis_client)

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    await redis_client.aclose()
    await pool.aclose()


app = FastAPI(
    title="DBDesign Platform API",
    description=(
        "Converts plain-English descriptions into ERD schemas, SQL DDL, "
        "Prisma schemas, DBML, and database migrations."
    ),
    version="0.2.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate_router)


@app.get("/health", tags=["ops"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
