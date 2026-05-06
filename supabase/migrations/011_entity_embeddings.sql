-- ============================================================
-- 011: People & project embeddings (pgvector) for semantic search
-- ============================================================
-- Mirrors migration 010's note embeddings to enable semantic
-- search across people and projects, not just notes.
-- ============================================================

-- 1. Add embedding columns
ALTER TABLE public.people ADD COLUMN embedding vector(1536);
ALTER TABLE public.projects ADD COLUMN embedding vector(1536);

-- 2. HNSW indexes for fast cosine similarity search
CREATE INDEX idx_people_embedding ON public.people
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_projects_embedding ON public.projects
  USING hnsw (embedding vector_cosine_ops);

-- 3. RPC: find similar people by query embedding
CREATE OR REPLACE FUNCTION public.find_similar_people(
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  name text,
  role text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id,
    p.name,
    p.role,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.people p
  WHERE p.embedding IS NOT NULL
    AND p.user_id = auth.uid()
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 4. RPC: find similar projects by query embedding
CREATE OR REPLACE FUNCTION public.find_similar_projects(
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  name text,
  status text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id,
    p.name,
    p.status,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.projects p
  WHERE p.embedding IS NOT NULL
    AND p.user_id = auth.uid()
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;
