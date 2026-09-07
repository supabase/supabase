create table private.run_events (
  seq bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  run_id uuid not null references private.conversation_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'run.started', 'run.completed', 'run.failed', 'run.cancelled',
    'run.waiting_for_approval', 'run.interrupted', 'approval.requested',
    'approval.responded', 'tool.started', 'tool.completed', 'tool.failed'
  )),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on private.run_events(conversation_id, seq);
create index on private.run_events(run_id);
create index on private.run_events(user_id);
alter table private.run_events enable row level security;
revoke all on private.run_events from public, anon, authenticated;
revoke all on sequence private.run_events_seq_seq from public, anon, authenticated;
