"""
Application settings — loaded once at startup from environment / .env file.

All config is declared here. No other module should read os.environ directly.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",          # silently drop unknown env vars
    )

    # ── Database ─────────────────────────────────────────────────────────────
    database_url: str

    # ── Redis ─────────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── Gemini ────────────────────────────────────────────────────────────────
    gemini_api_key: str
    gemini_model: str = "gemini-1.5-flash"
    gemini_max_retries: int = 2          # self-healing retry budget (Phase 2)

    # ── API ───────────────────────────────────────────────────────────────────
    debug: bool = False
    secret_key: str
    cors_origins: list[str] = ["http://localhost:3000"]

    # ── Cache ─────────────────────────────────────────────────────────────────
    prompt_cache_ttl_seconds: int = 3600  # 1 hour

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_cors_string(cls, v: str | list[str]) -> list[str]:
        """Accept comma-separated string from env or a proper list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


# Single shared instance imported everywhere:  from app.core.config import settings
settings = Settings()
