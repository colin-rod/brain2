-- ============================================================
-- Brain2 — Initial Schema
-- ============================================================
-- Tables, indexes, RLS policies, triggers, and storage buckets.
-- Run with: npx supabase db push
-- ============================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- Profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  email text,
  full_name text
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Updated_at trigger function
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- Captures
-- ============================================================
create table public.captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in ('image', 'text', 'chat_transcript')),
  source_app text,
  raw_text text,
  file_path text,
  ocr_text text,
  parsed_json jsonb,
  status text not null default 'new'
    check (status in ('new', 'processing', 'ocr_complete', 'parsed', 'in_review', 'saved', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger captures_updated_at
  before update on public.captures
  for each row execute function public.set_updated_at();

create index idx_captures_user_status_created
  on public.captures (user_id, status, created_at desc);

alter table public.captures enable row level security;

create policy "Users can view own captures"
  on public.captures for select using (auth.uid() = user_id);
create policy "Users can insert own captures"
  on public.captures for insert with check (auth.uid() = user_id);
create policy "Users can update own captures"
  on public.captures for update using (auth.uid() = user_id);
create policy "Users can delete own captures"
  on public.captures for delete using (auth.uid() = user_id);

-- ============================================================
-- Notes
-- ============================================================
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  capture_id uuid not null references public.captures(id) on delete cascade,
  title text not null,
  summary text,
  cleaned_text text,
  markdown_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

create index idx_notes_user_created
  on public.notes (user_id, created_at desc);

alter table public.notes enable row level security;

create policy "Users can view own notes"
  on public.notes for select using (auth.uid() = user_id);
create policy "Users can insert own notes"
  on public.notes for insert with check (auth.uid() = user_id);
create policy "Users can update own notes"
  on public.notes for update using (auth.uid() = user_id);
create policy "Users can delete own notes"
  on public.notes for delete using (auth.uid() = user_id);

-- ============================================================
-- Tasks
-- ============================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  title text not null,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done', 'canceled')),
  priority text check (priority in ('high', 'medium', 'low')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create index idx_tasks_user_status_due
  on public.tasks (user_id, status, due_date);

alter table public.tasks enable row level security;

create policy "Users can view own tasks"
  on public.tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks"
  on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks"
  on public.tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks"
  on public.tasks for delete using (auth.uid() = user_id);

-- ============================================================
-- People
-- ============================================================
create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  role text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger people_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

create index idx_people_user_name
  on public.people (user_id, lower(name));

alter table public.people enable row level security;

create policy "Users can view own people"
  on public.people for select using (auth.uid() = user_id);
create policy "Users can insert own people"
  on public.people for insert with check (auth.uid() = user_id);
create policy "Users can update own people"
  on public.people for update using (auth.uid() = user_id);
create policy "Users can delete own people"
  on public.people for delete using (auth.uid() = user_id);

-- ============================================================
-- Projects
-- ============================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create index idx_projects_user_name
  on public.projects (user_id, lower(name));

alter table public.projects enable row level security;

create policy "Users can view own projects"
  on public.projects for select using (auth.uid() = user_id);
create policy "Users can insert own projects"
  on public.projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects"
  on public.projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects"
  on public.projects for delete using (auth.uid() = user_id);

-- ============================================================
-- Decisions
-- ============================================================
create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  decision_text text not null,
  rationale text,
  decision_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger decisions_updated_at
  before update on public.decisions
  for each row execute function public.set_updated_at();

create index idx_decisions_user_date
  on public.decisions (user_id, decision_date);

alter table public.decisions enable row level security;

create policy "Users can view own decisions"
  on public.decisions for select using (auth.uid() = user_id);
create policy "Users can insert own decisions"
  on public.decisions for insert with check (auth.uid() = user_id);
create policy "Users can update own decisions"
  on public.decisions for update using (auth.uid() = user_id);
create policy "Users can delete own decisions"
  on public.decisions for delete using (auth.uid() = user_id);

-- ============================================================
-- Open Questions
-- ============================================================
create table public.open_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  question_text text not null,
  status text not null default 'open'
    check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger open_questions_updated_at
  before update on public.open_questions
  for each row execute function public.set_updated_at();

create index idx_open_questions_user_status
  on public.open_questions (user_id, status);

alter table public.open_questions enable row level security;

create policy "Users can view own open_questions"
  on public.open_questions for select using (auth.uid() = user_id);
create policy "Users can insert own open_questions"
  on public.open_questions for insert with check (auth.uid() = user_id);
create policy "Users can update own open_questions"
  on public.open_questions for update using (auth.uid() = user_id);
create policy "Users can delete own open_questions"
  on public.open_questions for delete using (auth.uid() = user_id);

-- ============================================================
-- Junction Tables
-- ============================================================
create table public.note_people (
  note_id uuid not null references public.notes(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  primary key (note_id, person_id)
);

alter table public.note_people enable row level security;

create policy "Users can view own note_people"
  on public.note_people for select
  using (exists (
    select 1 from public.notes where notes.id = note_people.note_id and notes.user_id = auth.uid()
  ));
create policy "Users can insert own note_people"
  on public.note_people for insert
  with check (exists (
    select 1 from public.notes where notes.id = note_people.note_id and notes.user_id = auth.uid()
  ));
create policy "Users can delete own note_people"
  on public.note_people for delete
  using (exists (
    select 1 from public.notes where notes.id = note_people.note_id and notes.user_id = auth.uid()
  ));

create table public.note_projects (
  note_id uuid not null references public.notes(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  primary key (note_id, project_id)
);

alter table public.note_projects enable row level security;

create policy "Users can view own note_projects"
  on public.note_projects for select
  using (exists (
    select 1 from public.notes where notes.id = note_projects.note_id and notes.user_id = auth.uid()
  ));
create policy "Users can insert own note_projects"
  on public.note_projects for insert
  with check (exists (
    select 1 from public.notes where notes.id = note_projects.note_id and notes.user_id = auth.uid()
  ));
create policy "Users can delete own note_projects"
  on public.note_projects for delete
  using (exists (
    select 1 from public.notes where notes.id = note_projects.note_id and notes.user_id = auth.uid()
  ));

-- ============================================================
-- Storage Buckets
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('captures', 'captures', false),
  ('exports', 'exports', false);

-- Captures bucket: user can CRUD own files (user_id prefix)
create policy "Users can upload captures"
  on storage.objects for insert
  with check (
    bucket_id = 'captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own captures"
  on storage.objects for select
  using (
    bucket_id = 'captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own captures"
  on storage.objects for delete
  using (
    bucket_id = 'captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Exports bucket: user can CRUD own files (user_id prefix)
create policy "Users can upload exports"
  on storage.objects for insert
  with check (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own exports"
  on storage.objects for select
  using (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own exports"
  on storage.objects for delete
  using (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
