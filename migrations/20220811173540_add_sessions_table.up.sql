-- Add session_id column to refresh_tokens table
create table if not exists {{ index .Options "Namespace" }}.sessions (
    id uuid not null,
    user_id uuid not null,
    created_at timestamptz null,
    updated_at timestamptz null,
    constraint sessions_pkey primary key (id),
    constraint sessions_user_id_fkey foreign key (user_id) references {{ index .Options "Namespace" }}.users(id) on delete cascade
);
comment on table {{ index .Options "Namespace" }}.sessions is 'Auth: Stores session data associated to a user.';

alter table {{ index .Options "Namespace" }}.refresh_tokens
add column if not exists session_id uuid null;

do $$
begin
  if not exists(select *
    from information_schema.constraint_column_usage
    where table_schema = '{{ index .Options "Namespace" }}' and table_name='sessions' and constraint_name='refresh_tokens_session_id_fkey')
  then
      alter table "{{ index .Options "Namespace" }}"."refresh_tokens" add constraint refresh_tokens_session_id_fkey foreign key (session_id) references {{ index .Options "Namespace" }}.sessions(id) on delete cascade;
  end if;
END $$;
