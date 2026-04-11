-- 008: Add ideas entity

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  note_id uuid references public.notes(id) on delete set null,
  idea_text text not null,
  status text not null default 'raw'
    check (status in ('raw', 'developing', 'accepted', 'rejected', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ideas_updated_at
  before update on public.ideas
  for each row execute function public.set_updated_at();

create index idx_ideas_user_status
  on public.ideas (user_id, status);

alter table public.ideas enable row level security;

create policy "Users can view own ideas"
  on public.ideas for select
  using (auth.uid() = user_id);

create policy "Users can insert own ideas"
  on public.ideas for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ideas"
  on public.ideas for update
  using (auth.uid() = user_id);

create policy "Users can delete own ideas"
  on public.ideas for delete
  using (auth.uid() = user_id);
