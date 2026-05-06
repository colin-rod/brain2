-- ============================================================
-- Add 'voice' and 'email' to captures.source_type check constraint
-- ============================================================

alter table public.captures
  drop constraint if exists captures_source_type_check;

alter table public.captures
  add constraint captures_source_type_check
  check (source_type in ('image', 'text', 'chat_transcript', 'voice', 'email'));
