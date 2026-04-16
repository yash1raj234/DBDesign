"""
FastAPI dependency callables — injected via Depends() in route handlers.
"""

from __future__ import annotations

from typing import AsyncGenerator

import redis.asyncio as aioredis
from fastapi import Request

from app.core.config import settings
from app.services.gemini import GeminiService


# ── Redis ─────────────────────────────────────────────────────────────────────


def get_redis_pool() -> aioredis.ConnectionPool:
    """
    Module-level singleton pool.  Called once at startup via the lifespan hook
    added to main.py.  lru_cache ensures only one pool is ever created.
    """
    return aioredis.ConnectionPool.from_url(
        settings.redis_url,
        decode_responses=True,
        max_connections=20,
    )


async def get_redis(request: Request) -> AsyncGenerator[aioredis.Redis, None]:
    """
    Yields a Redis client borrowed from the shared connection pool.
    The pool is stored on app.state so it survives across requests.
    """
    client: aioredis.Redis = aioredis.Redis(
        connection_pool=request.app.state.redis_pool
    )
    try:
        yield client
    finally:
        await client.aclose()


# ── GeminiService ─────────────────────────────────────────────────────────────


async def get_gemini_service(request: Request) -> GeminiService:
    """
    Returns the GeminiService singleton stored on app.state.
    The service holds the model handle; creating it once avoids repeated
    SDK initialisation overhead.
    """
    return request.app.state.gemini_service
