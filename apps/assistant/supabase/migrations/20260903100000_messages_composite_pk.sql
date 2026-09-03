-- The initial migration was edited after it had already been applied locally
-- (messages.pkey stayed PRIMARY KEY (id)). Chat upserts ON CONFLICT
-- (conversation_id, id), which Postgres rejects until the live constraint matches.

alter table public.message_feedback
  add column if not exists conversation_id uuid;

update public.message_feedback as f
set conversation_id = m.conversation_id
from public.messages as m
where f.conversation_id is null
  and f.message_id = m.id;

delete from public.message_feedback as f
where f.conversation_id is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'message_feedback'
      and column_name = 'conversation_id'
      and is_nullable = 'YES'
  ) then
    alter table public.message_feedback
      alter column conversation_id set not null;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'message_feedback_message_id_fkey'
      and conrelid = 'public.message_feedback'::regclass
  ) then
    alter table public.message_feedback
      drop constraint message_feedback_message_id_fkey;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'messages_pkey'
      and conrelid = 'public.messages'::regclass
      and pg_get_constraintdef(oid) = 'PRIMARY KEY (id)'
  ) then
    alter table public.messages drop constraint messages_pkey;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_pkey'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages add primary key (conversation_id, id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'message_feedback_conversation_id_message_id_fkey'
      and conrelid = 'public.message_feedback'::regclass
  ) then
    alter table public.message_feedback
      add constraint message_feedback_conversation_id_message_id_fkey
      foreign key (conversation_id, message_id)
      references public.messages (conversation_id, id)
      on delete cascade;
  end if;
end $$;

create index if not exists message_feedback_conversation_id_message_id_idx
  on public.message_feedback (conversation_id, message_id);
