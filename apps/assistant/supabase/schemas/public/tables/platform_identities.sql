create table public.platform_identities (
  platform_user_id uuid primary key,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.platform_identities enable row level security;

create policy "own identity"
  on public.platform_identities
  for select
  to authenticated
  using (user_id = (select auth.uid()));
