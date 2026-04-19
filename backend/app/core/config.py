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

    # ── Groq ──────────────────────────────────────────────────────────────────
    groq_api_key: str
    groq_model: str = "llama3-70b-8192"
    llm_max_retries: int = 2          # self-healing retry budget (Phase 2)

    # ── API ───────────────────────────────────────────────────────────────────
    debug: bool = False
    secret_key: str
    cors_origins: str = "http://localhost:3000"

    # ── Cache ─────────────────────────────────────────────────────────────────
    prompt_cache_ttl_seconds: int = 3600  # 1 hour

    @property
    def parsed_cors_origins(self) -> list[str]:
        v = self.cors_origins.strip()
        if v.startswith("["):
            import json
            return json.loads(v)
        return [o.strip() for o in v.split(",") if o.strip()]


# Single shared instance imported everywhere:  from app.core.config import settings
settings = Settings()
