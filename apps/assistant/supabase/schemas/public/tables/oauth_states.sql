create table public.oauth_states (
  state text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  org_slug text not null,
  code_verifier text not null,
  return_to text,
  expires_at timestamptz not null
);

create index on public.oauth_states (user_id);

alter table public.oauth_states enable row level security;
