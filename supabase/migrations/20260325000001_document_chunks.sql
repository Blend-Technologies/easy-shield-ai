-- Session-scoped document chunks for RAG (proposal evaluator & writer).
CREATE TABLE IF NOT EXISTS document_chunks (
  id            bigserial PRIMARY KEY,
  session_id    text        NOT NULL,
  document_name text        NOT NULL,
  content       text        NOT NULL,
  chunk_index   integer     NOT NULL DEFAULT 0,
  embedding     vector(1536),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_chunks_session_idx
  ON document_chunks (session_id);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);
