-- ============================================================
-- 010: Note embeddings (pgvector) & note-to-note links
-- ============================================================
-- Adds vector similarity search for AI-suggested note linking,
-- plus a junction table for confirmed note-to-note references.
-- ============================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to notes
ALTER TABLE public.notes ADD COLUMN embedding vector(1536);

-- 3. Create HNSW index for fast cosine similarity search
CREATE INDEX idx_notes_embedding ON public.notes
  USING hnsw (embedding vector_cosine_ops);

-- 4. Create note_notes junction table
CREATE TABLE public.note_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  linked_note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT note_notes_no_self_link CHECK (note_id != linked_note_id),
  CONSTRAINT note_notes_unique_pair UNIQUE (note_id, linked_note_id)
);

CREATE INDEX idx_note_notes_note ON public.note_notes (note_id);
CREATE INDEX idx_note_notes_linked ON public.note_notes (linked_note_id);

-- 5. RLS policies for note_notes
ALTER TABLE public.note_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own note_notes"
  ON public.note_notes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own note_notes"
  ON public.note_notes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own note_notes"
  ON public.note_notes FOR DELETE
  USING (user_id = auth.uid());

-- 6. RPC function for cosine similarity search
CREATE OR REPLACE FUNCTION public.find_similar_notes(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  note_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'
)
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    n.id,
    n.title,
    n.summary,
    1 - (n.embedding <=> query_embedding) AS similarity
  FROM public.notes n
  WHERE n.embedding IS NOT NULL
    AND n.id != note_id
    AND n.user_id = auth.uid()
    AND n.archived_at IS NULL
  ORDER BY n.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 7. RPC function for orphaned notes (no linked people, projects, or domains)
CREATE OR REPLACE FUNCTION public.get_orphaned_notes()
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  created_at timestamptz
)
LANGUAGE sql STABLE
AS $$
  SELECT n.id, n.title, n.summary, n.created_at
  FROM public.notes n
  WHERE n.user_id = auth.uid()
    AND n.archived_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM public.note_people np WHERE np.note_id = n.id)
    AND NOT EXISTS (SELECT 1 FROM public.note_projects nj WHERE nj.note_id = n.id)
    AND NOT EXISTS (SELECT 1 FROM public.note_domains nd WHERE nd.note_id = n.id)
  ORDER BY n.created_at DESC;
$$;
