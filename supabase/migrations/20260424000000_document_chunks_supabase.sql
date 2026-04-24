-- Enable pgvector (safe to run even if already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Session-scoped RAG storage for uploaded RFP/proposal documents.
-- Replaces the Azure PostgreSQL document_chunks table so edge functions
-- can use the always-reachable Supabase DB instead.
CREATE TABLE IF NOT EXISTS document_chunks (
  id            bigserial    PRIMARY KEY,
  session_id    text         NOT NULL,
  document_name text         NOT NULL,
  content       text         NOT NULL,
  chunk_index   int          NOT NULL,
  embedding     vector(1536),
  created_at    timestamptz  DEFAULT now()
);

-- Fast cosine-similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Fast session-scoped deletes / selects
CREATE INDEX IF NOT EXISTS document_chunks_session_idx
  ON document_chunks (session_id);

-- Auto-clean chunks older than 24 h so the table doesn't grow unbounded
-- (edge functions also delete by session on each new upload)
CREATE OR REPLACE FUNCTION delete_old_document_chunks() RETURNS void
  LANGUAGE sql AS $$
    DELETE FROM document_chunks WHERE created_at < now() - interval '24 hours';
  $$;
