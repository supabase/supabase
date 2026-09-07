create table private.conversation_runs (
  id uuid primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on private.conversation_runs(user_id, created_at desc);
alter table private.conversation_runs enable row level security;
revoke all on private.conversation_runs from public, anon, authenticated;
