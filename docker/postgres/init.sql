-- Postgres initialisation script.
-- Runs once on first container start (mounted as /docker-entrypoint-initdb.d/).

-- Enable UUID generation (used by schema share links in Phase 4)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Saved diagrams table (Phase 4 — GET /schema/:id)
CREATE TABLE IF NOT EXISTS saved_schemas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT,
    schema_json JSONB    NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_schemas_created_at ON saved_schemas (created_at DESC);
