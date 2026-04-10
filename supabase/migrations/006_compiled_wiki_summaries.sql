-- Add cached compiled summary columns to people and projects
-- Used by wiki pages to store LLM-generated summaries with on-view + cache strategy

ALTER TABLE public.people
  ADD COLUMN compiled_summary text,
  ADD COLUMN summary_generated_at timestamptz;

ALTER TABLE public.projects
  ADD COLUMN compiled_summary text,
  ADD COLUMN summary_generated_at timestamptz;
