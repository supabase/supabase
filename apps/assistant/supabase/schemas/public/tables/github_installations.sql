create table public.github_installations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  installation_id bigint not null,
  account_login text not null,
  created_at timestamptz not null default now(),
  unique (user_id, installation_id)
);

create index on public.github_installations (user_id);

alter table public.github_installations enable row level security;

create policy "own installations"
  on public.github_installations
  for select
  to authenticated
  using (user_id = (select auth.uid()));
