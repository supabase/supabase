create table public.messages (
  id text not null,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  parts jsonb not null,
  metadata jsonb,
  seq bigint generated always as identity,
  created_at timestamptz not null default now(),
  primary key (conversation_id, id)
);

create index on public.messages (conversation_id, seq);
create index on public.messages (user_id);

alter table public.messages enable row level security;

create policy "own messages"
  on public.messages
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create trigger messages_bump_conversation_updated_at
  after insert on public.messages
  for each row
  execute function private.bump_conversation_updated_at();
