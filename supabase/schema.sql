-- Logomaker Supabase schema
-- Run in the Supabase SQL editor.

create table if not exists public.projects (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);

alter table public.projects enable row level security;

create policy "Users can read own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Public bucket for AI-generated raster marks (served in logos/exports).
insert into storage.buckets (id, name, public)
values ('logo-assets', 'logo-assets', true)
on conflict (id) do nothing;

create policy "Public read access for logo assets"
  on storage.objects for select
  using (bucket_id = 'logo-assets');
