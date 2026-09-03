create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_ref text not null,
  org_slug text not null,
  name text not null default 'Untitled',
  model text,
  support_metadata jsonb,
  branched_from jsonb,
  surface text not null default 'studio',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index on public.conversations (user_id, project_ref, updated_at desc);

alter table public.conversations enable row level security;

create policy "own conversations"
  on public.conversations
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
