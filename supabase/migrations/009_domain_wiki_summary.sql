ALTER TABLE domains
  ADD COLUMN compiled_summary text,
  ADD COLUMN summary_generated_at timestamptz;
