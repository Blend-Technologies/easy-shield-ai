CREATE USER ezshield_app WITH PASSWORD 'BlendWinter2026';
GRANT ALL PRIVILEGES ON DATABASE request_for_proposal TO ezshield_app;

GRANT ALL PRIVILEGES ON TABLE document_chunks TO ezshield_app;


-- document_chunks table creation
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS document_chunks (
  id          BIGSERIAL PRIMARY KEY,
  session_id  TEXT NOT NULL,
  document_name TEXT NOT NULL,
  content     TEXT NOT NULL,
  chunk_index INT NOT NULL,
  embedding   vector(1536),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_session
  ON document_chunks (session_id);

CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);


