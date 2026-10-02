-- see: https://stackoverflow.com/questions/7624919/check-if-a-user-defined-type-already-exists-in-postgresql/48382296#48382296
do $$ begin
    create type {{ index .Options "Namespace" }}.code_challenge_method as enum('s256', 'plain');
exception
    when duplicate_object then null;
end $$;
create table if not exists {{ index .Options "Namespace" }}.flow_state(
       id uuid primary key,
       user_id uuid null,
       auth_code text not null,
       code_challenge_method {{ index .Options "Namespace" }}.code_challenge_method not null,
       code_challenge text not null,
       provider_type text not null,
       provider_access_token text null,
       provider_refresh_token text null,
       created_at timestamptz null,
       updated_at timestamptz null
);
create index if not exists idx_auth_code on {{ index .Options "Namespace" }}.flow_state(auth_code);
comment on table {{ index .Options "Namespace" }}.flow_state is 'stores metadata for pkce logins';
