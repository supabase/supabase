create table public.oauth_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  org_slug text not null,
  vault_secret_id uuid not null,
  scopes text[] not null default '{}',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, org_slug)
);

create index on public.oauth_connections (user_id);

alter table public.oauth_connections enable row level security;

create policy "own connections (metadata only)"
  on public.oauth_connections
  for select
  to authenticated
  using (user_id = (select auth.uid()));
