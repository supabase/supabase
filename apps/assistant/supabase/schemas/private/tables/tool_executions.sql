create table private.tool_executions (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  tool_call_id text not null,
  tool_name text not null,
  input jsonb not null,
  status text not null check (status in ('started', 'completed', 'failed')),
  output jsonb,
  primary key (conversation_id, tool_call_id)
);
alter table private.tool_executions enable row level security;
revoke all on private.tool_executions from public, anon, authenticated;
