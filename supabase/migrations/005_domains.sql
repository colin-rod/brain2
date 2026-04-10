-- ============================================================
-- Brain2 — Domains entity
-- ============================================================
-- Adds domains table and note_domains junction table.
-- Run with: npx supabase db push
-- ============================================================

-- ============================================================
-- Domains
-- ============================================================
create table public.domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger domains_updated_at
  before update on public.domains
  for each row execute function public.set_updated_at();

create index idx_domains_user_name
  on public.domains (user_id, lower(name));

alter table public.domains enable row level security;

create policy "Users can view own domains"
  on public.domains for select using (auth.uid() = user_id);
create policy "Users can insert own domains"
  on public.domains for insert with check (auth.uid() = user_id);
create policy "Users can update own domains"
  on public.domains for update using (auth.uid() = user_id);
create policy "Users can delete own domains"
  on public.domains for delete using (auth.uid() = user_id);

-- ============================================================
-- Junction: note_domains
-- ============================================================
create table public.note_domains (
  note_id uuid not null references public.notes(id) on delete cascade,
  domain_id uuid not null references public.domains(id) on delete cascade,
  primary key (note_id, domain_id)
);

alter table public.note_domains enable row level security;

create policy "Users can view own note_domains"
  on public.note_domains for select
  using (exists (
    select 1 from public.notes where notes.id = note_domains.note_id and notes.user_id = auth.uid()
  ));
create policy "Users can insert own note_domains"
  on public.note_domains for insert
  with check (exists (
    select 1 from public.notes where notes.id = note_domains.note_id and notes.user_id = auth.uid()
  ));
create policy "Users can delete own note_domains"
  on public.note_domains for delete
  using (exists (
    select 1 from public.notes where notes.id = note_domains.note_id and notes.user_id = auth.uid()
  ));
