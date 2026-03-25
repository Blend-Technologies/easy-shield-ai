-- Permanent knowledge base for proposal style templates and reference documents.
-- Unlike document_chunks (session-scoped), these rows persist permanently.

CREATE TABLE IF NOT EXISTS knowledge_base_chunks (
  id            bigserial PRIMARY KEY,
  document_name text        NOT NULL,
  category      text        NOT NULL DEFAULT 'style_template',
  content       text        NOT NULL,
  chunk_index   integer     NOT NULL DEFAULT 0,
  embedding     vector(1536),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for fast cosine-similarity search
CREATE INDEX IF NOT EXISTS knowledge_base_chunks_embedding_idx
  ON knowledge_base_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

CREATE INDEX IF NOT EXISTS knowledge_base_chunks_category_idx
  ON knowledge_base_chunks (category);
