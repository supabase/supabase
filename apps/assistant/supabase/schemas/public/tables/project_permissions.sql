-- Assistant consent is per user/project and is never inherited from Studio's legacy org opt-in.
create table public.project_permissions (
  user_id uuid not null references auth.users (id) on delete cascade,
  project_ref text not null,
  org_slug text not null,
  level text not null check (level in ('disabled', 'schema', 'schema_and_log', 'schema_and_log_and_data')),
  consent_version integer not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, project_ref)
);

alter table public.project_permissions enable row level security;
create policy "own project permissions" on public.project_permissions
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.project_permissions from anon, authenticated;
grant select on public.project_permissions to authenticated;
