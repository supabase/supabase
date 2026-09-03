create table public.message_feedback (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  message_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating text not null check (rating in ('positive', 'negative')),
  reason text,
  braintrust_span_id text,
  created_at timestamptz not null default now(),
  foreign key (conversation_id, message_id) references public.messages (conversation_id, id) on delete cascade
);

create index on public.message_feedback (conversation_id, message_id);
create index on public.message_feedback (user_id);

alter table public.message_feedback enable row level security;

create policy "own feedback"
  on public.message_feedback
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
