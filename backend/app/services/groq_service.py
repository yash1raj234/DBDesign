"""
GroqService — text → validated ERDSchema via Groq LLaMA3.

Flow
----
1. Hash prompt + db_target → Redis cache key.
2. Cache hit  → deserialise and return immediately.
3. Cache miss → call Groq with a structured system prompt.
4. Parse JSON response → validate with ERDSchema (Pydantic).
5. ValidationError → build LLMRetryContext → retry up to
   settings.llm_max_retries times with the error fed back to Groq.
6. On success → stamp metadata, cache, return schema.
"""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any

from groq import AsyncGroq
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.erd_schema import DBTarget, ERDSchema, LLMRetryContext

logger = logging.getLogger(__name__)

# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT_TEMPLATE = """\
You are an expert database architect. Convert the user's plain-English description \
into a valid JSON object representing a relational database schema.

━━━ MANDATORY RULES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1.  Every table MUST have at least one column with "is_primary_key": true.
2.  Primary key columns MUST have "is_nullable": false.
3.  Use snake_case for ALL table and column names (e.g. order_item, user_id).
4.  "columns" inside "foreign_keys[].columns" MUST exactly match column names
    you declared in that same table — no typos.
5.  "referenced_table" MUST exactly match a table name in your "tables" array.
6.  "referenced_columns" MUST exist in the referenced table's column list.
7.  VARCHAR / CHAR   → always include  "type_params": {{"length": N}}
8.  DECIMAL / NUMERIC → always include  "type_params": {{"precision": P, "scale": S}}
9.  ENUM              → always include  "enum_values": ["val1", "val2", ...]
10. MANY_TO_MANY relationship: you MUST
      a) add a physical junction table to "tables"
      b) set "junction_table" to that table's name
      c) the junction table MUST have FK columns pointing to BOTH sides
11. Every FK column should have a matching index entry for performance.
12. Prefer INTEGER id columns unless UUID or composite PK is clearly appropriate.
{type_restrictions}

━━━ AVAILABLE DATA TYPES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SMALLINT · INTEGER · BIGINT · REAL · FLOAT · DOUBLE · DECIMAL · NUMERIC
SERIAL · BIGSERIAL · CHAR · VARCHAR · TEXT · DATE · TIME · TIMESTAMP
TIMESTAMPTZ · INTERVAL · BOOLEAN · BYTEA · BLOB · JSON · JSONB · UUID · ENUM

━━━ REQUIRED OUTPUT STRUCTURE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY a valid JSON object — no markdown, no code fences, no explanation.

Top-level fields:
  db_target       (string)  — one of: postgresql | mysql | sqlite
  schema_name     (string)  — default "public"
  title           (string)  — short descriptive title
  description     (string)  — one-sentence summary
  tables          (array)   — see Table shape below
  relationships   (array)   — see Relationship shape below
  enums           (array)   — global enum definitions (can be [])

Table shape:
{{
  "name": "snake_case_singular",
  "comment": "optional description",
  "columns": [
    {{
      "name":             "col_name",
      "data_type":        "INTEGER",
      "type_params":      null,
      "is_primary_key":   false,
      "is_nullable":      true,
      "is_unique":        false,
      "is_auto_increment":false,
      "default_value":    null,
      "check_constraint": null,
      "enum_values":      null,
      "comment":          null
    }}
  ],
  "foreign_keys": [
    {{
      "constraint_name":    null,
      "columns":            ["this_table_col"],
      "referenced_table":   "other_table",
      "referenced_columns": ["other_col"],
      "on_delete":          "NO_ACTION",
      "on_update":          "NO_ACTION"
    }}
  ],
  "indexes": [
    {{
      "name":       "idx_table_col",
      "columns":    ["col_name"],
      "index_type": "BTREE",
      "is_unique":  false,
      "where_clause": null
    }}
  ]
}}

Relationship shape:
{{
  "name":              "descriptive_name",
  "from_table":        "child_table",
  "from_column":       "fk_col",
  "to_table":          "parent_table",
  "to_column":         "id",
  "relationship_type": "one_to_many",
  "label":             "belongs to",
  "junction_table":    null
}}
FK action values: CASCADE | SET_NULL | SET_DEFAULT | RESTRICT | NO_ACTION
"""

_SQLITE_RESTRICTIONS = """
━━━ SQLITE RESTRICTIONS — do NOT use these types for SQLite ━━━━━━━━━━━━━━━━━━
  JSONB       → use JSON
  TIMESTAMPTZ → use TIMESTAMP
  UUID        → use TEXT
  BOOLEAN     → use INTEGER (0/1)
  SERIAL / BIGSERIAL → use INTEGER with "is_auto_increment": true
  ENUM        → use TEXT (add a check_constraint for validation)
"""

_MYSQL_RESTRICTIONS = """
━━━ MYSQL RESTRICTIONS — do NOT use these types for MySQL ━━━━━━━━━━━━━━━━━━━━
  JSONB       → use JSON
  TIMESTAMPTZ → use TIMESTAMP
  BYTEA       → use BLOB
  SERIAL / BIGSERIAL → use INT / BIGINT with "is_auto_increment": true
"""


def _system_prompt(db_target: DBTarget) -> str:
    restrictions = {
        DBTarget.SQLITE:     _SQLITE_RESTRICTIONS,
        DBTarget.MYSQL:      _MYSQL_RESTRICTIONS,
        DBTarget.POSTGRESQL: "",
    }
    return _SYSTEM_PROMPT_TEMPLATE.format(
        type_restrictions=restrictions.get(db_target, "")
    )


# ── Prompt hash ───────────────────────────────────────────────────────────────


def _prompt_hash(prompt: str, db_target: DBTarget) -> str:
    """SHA-256 of (prompt + db_target) — used as Redis cache key."""
    raw = f"{prompt}::{db_target.value}".encode()
    return hashlib.sha256(raw).hexdigest()


def _cache_key(prompt_hash: str) -> str:
    return f"schema:{prompt_hash}"


# ── GroqService ─────────────────────────────────────────────────────────────


class GroqService:
    """
    Stateless service. Instantiate once at application startup and reuse.

    Parameters
    ----------
    redis_client : redis.asyncio.Redis | None
        If None, caching is disabled (useful for tests).
    """

    def __init__(self, redis_client: Any | None = None) -> None:
        self.groq = AsyncGroq(api_key=settings.groq_api_key)
        self.model = settings.groq_model
        self._redis = redis_client

    # ── Public API ────────────────────────────────────────────────────────────

    async def generate(
        self, prompt: str, db_target: DBTarget
    ) -> tuple[ERDSchema, bool]:
        """
        Returns (schema, was_cached).

        Raises
        ------
        ValueError
            If Groq fails to produce a valid schema after all retries.
        """
        ph = _prompt_hash(prompt, db_target)

        # ── 1. Cache check ────────────────────────────────────────────────────
        if self._redis:
            cached = await self._redis.get(_cache_key(ph))
            if cached:
                logger.info("Cache hit for prompt_hash=%s", ph[:12])
                schema = ERDSchema.model_validate_json(cached)
                return schema, True

        # ── 2. Groq call + validation with retry ────────────────────────────
        system = _system_prompt(db_target)
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ]
        raw_json: dict[str, Any] = {}

        for attempt in range(settings.llm_max_retries + 1):
            response = await self.groq.chat.completions.create(
                model=self.model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=8192,
            )
            raw_text = response.choices[0].message.content
            try:
                raw_json = json.loads(raw_text)
            except Exception as exc:
                raw_json = {}
                
            raw_json.setdefault("db_target", db_target.value)

            try:
                schema = ERDSchema.model_validate(raw_json)
                break
            except ValidationError as exc:
                if attempt == settings.llm_max_retries:
                    raise ValueError(
                        f"Groq produced an invalid schema after "
                        f"{settings.llm_max_retries + 1} attempts.\n"
                        f"Last error: {exc}"
                    ) from exc
                logger.warning(
                    "Groq validation failed (attempt %d/%d), retrying: %s",
                    attempt + 1, settings.llm_max_retries, str(exc)[:200],
                )
                # Build a repair prompt
                repair_prompt = LLMRetryContext.from_validation_error(
                    original_prompt=prompt,
                    failed_output=raw_json,
                    exc=exc,
                    attempt=attempt + 1,
                ).to_repair_prompt()
                messages.append({"role": "assistant", "content": raw_text})
                messages.append({"role": "user", "content": repair_prompt})

        # ── 3. Stamp metadata ─────────────────────────────────────────────────
        schema.generated_at = datetime.now(tz=timezone.utc)
        schema.prompt_hash  = ph

        # ── 4. Cache the result ───────────────────────────────────────────────
        if self._redis:
            await self._redis.set(
                _cache_key(ph),
                schema.model_dump_json(),
                ex=settings.prompt_cache_ttl_seconds,
            )

        return schema, False

    async def refine(
        self, existing: ERDSchema, follow_up: str
    ) -> ERDSchema:
        """
        Apply a natural-language refinement to an existing schema.
        Uses the same retry logic as generate().
        """
        db_target = existing.db_target
        system    = _system_prompt(db_target)

        current_json = existing.model_dump_json(indent=2)
        refine_prompt = (
            f"You have an existing database schema (JSON below). "
            f"Apply ONLY the changes described in the follow-up instruction. "
            f"Return ONLY the complete updated schema JSON.\n\n"
            f"Follow-up instruction: {follow_up}\n\n"
            f"Existing schema:\n{current_json}"
        )
        
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": refine_prompt}
        ]

        raw_json: dict[str, Any] = {}
        for attempt in range(settings.llm_max_retries + 1):
            response = await self.groq.chat.completions.create(
                model=self.model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=8192,
            )
            raw_text = response.choices[0].message.content
            try:
                raw_json = json.loads(raw_text)
            except Exception as exc:
                raw_json = {}
                
            raw_json.setdefault("db_target", db_target.value)

            try:
                schema = ERDSchema.model_validate(raw_json)
                schema.generated_at = datetime.now(tz=timezone.utc)
                return schema
            except ValidationError as exc:
                if attempt == settings.llm_max_retries:
                    raise ValueError(
                        f"Groq produced an invalid schema after "
                        f"{settings.llm_max_retries + 1} refinement attempts.\n"
                        f"Last error: {exc}"
                    ) from exc
                
                repair_prompt = LLMRetryContext.from_validation_error(
                    original_prompt=follow_up,
                    failed_output=raw_json,
                    exc=exc,
                    attempt=attempt + 1,
                ).to_repair_prompt()
                messages.append({"role": "assistant", "content": raw_text})
                messages.append({"role": "user", "content": repair_prompt})

        raise RuntimeError("Unreachable")  # loop always breaks or raises above
