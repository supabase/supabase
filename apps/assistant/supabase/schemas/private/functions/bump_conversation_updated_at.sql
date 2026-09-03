create or replace function private.bump_conversation_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

revoke all on function private.bump_conversation_updated_at() from public;
