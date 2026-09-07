create table public.oauth_states (
  state text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  org_slug text not null,
  -- Pre-upgrade states have no browser binding and cannot be completed.
  code_challenge text,
  return_to text,
  expires_at timestamptz not null
);

create index on public.oauth_states (user_id);

alter table public.oauth_states enable row level security;

revoke all on public.oauth_states from anon, authenticated;
