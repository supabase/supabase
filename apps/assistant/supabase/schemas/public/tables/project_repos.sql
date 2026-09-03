create table public.project_repos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_ref text not null,
  installation_id bigint not null,
  repo_full_name text not null,
  default_branch text not null default 'main',
  created_at timestamptz not null default now(),
  unique (user_id, project_ref)
);

create index on public.project_repos (user_id);

alter table public.project_repos enable row level security;

create policy "own repos"
  on public.project_repos
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
