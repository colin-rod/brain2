-- 007: Add archived_at to notes for soft-delete / archive feature
ALTER TABLE public.notes
  ADD COLUMN archived_at TIMESTAMPTZ NULL;

-- Index to make the default "exclude archived" filter efficient
CREATE INDEX idx_notes_user_archived_created
  ON public.notes (user_id, archived_at, created_at DESC);
