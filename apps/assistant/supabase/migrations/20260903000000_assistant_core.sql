-- Initial apply of supabase/schemas (pg-delta). Edit the declarative files, then
-- `npx --yes supabase@beta db schema declarative sync -f <name>` to generate the next migration.

create extension if not exists supabase_vault with schema vault;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to service_role;

-- ---------------------------------------------------------------------------
-- identity
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- management api oauth
-- ---------------------------------------------------------------------------

create table public.oauth_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  org_slug text not null,
  vault_secret_id uuid not null,
  scopes text[] not null default '{}',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, org_slug)
);

create index on public.oauth_connections (user_id);

alter table public.oauth_connections enable row level security;

create policy "own connections (metadata only)"
  on public.oauth_connections
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create table public.oauth_states (
  state text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  org_slug text not null,
  code_verifier text not null,
  return_to text,
  expires_at timestamptz not null
);

create index on public.oauth_states (user_id);

alter table public.oauth_states enable row level security;

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_ref text not null,
  org_slug text not null,
  name text not null default 'Untitled',
  model text,
  support_metadata jsonb,
  branched_from jsonb,
  surface text not null default 'studio',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index on public.conversations (user_id, project_ref, updated_at desc);

alter table public.conversations enable row level security;

create policy "own conversations"
  on public.conversations
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

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

-- ---------------------------------------------------------------------------
-- github + sandboxes
-- ---------------------------------------------------------------------------

create table public.github_installations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  installation_id bigint not null,
  account_login text not null,
  created_at timestamptz not null default now(),
  unique (user_id, installation_id)
);

create index on public.github_installations (user_id);

alter table public.github_installations enable row level security;

create policy "own installations"
  on public.github_installations
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create table public.project_repos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_ref text not null,
  installation_id bigint not null,
  repo_full_name text not null,
  default_branch text not null default 'main',
  created_at timestamptz not null default now(),
  unique (user_id, project_ref)
);

create index on public.project_repos (user_id);

alter table public.project_repos enable row level security;

create policy "own repos"
  on public.project_repos
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create table public.sandboxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  project_repo_id uuid not null references public.project_repos (id) on delete cascade,
  provider text not null,
  provider_ref text,
  endpoint_url text,
  status text not null check (status in ('pending', 'running', 'suspended', 'terminated', 'error')),
  branch text not null,
  agent_session_id text,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  terminated_at timestamptz
);

create index on public.sandboxes (conversation_id);
create index on public.sandboxes (user_id);
create index on public.sandboxes (status, last_activity_at);
create index on public.sandboxes (project_repo_id);

alter table public.sandboxes enable row level security;

create policy "own sandboxes"
  on public.sandboxes
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- vault-backed oauth token helpers (service_role only)
-- ---------------------------------------------------------------------------

create or replace function private.store_oauth_tokens(
  p_user_id uuid,
  p_org_slug text,
  p_access_token text,
  p_refresh_token text,
  p_expires_at timestamptz,
  p_scopes text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_secret_id uuid;
  new_secret_id uuid;
  secret_payload text;
  secret_name text;
begin
  secret_payload := json_build_object(
    'access_token', p_access_token,
    'refresh_token', p_refresh_token
  )::text;
  secret_name := format('oauth:%s:%s', p_user_id, p_org_slug);

  select oc.vault_secret_id
    into existing_secret_id
  from public.oauth_connections as oc
  where oc.user_id = p_user_id
    and oc.org_slug = p_org_slug;

  if existing_secret_id is not null then
    perform vault.update_secret(existing_secret_id, secret_payload);

    update public.oauth_connections
    set
      scopes = coalesce(p_scopes, '{}'::text[]),
      expires_at = p_expires_at,
      updated_at = now()
    where user_id = p_user_id
      and org_slug = p_org_slug;
  else
    new_secret_id := vault.create_secret(secret_payload, secret_name);

    insert into public.oauth_connections (
      user_id,
      org_slug,
      vault_secret_id,
      scopes,
      expires_at
    )
    values (
      p_user_id,
      p_org_slug,
      new_secret_id,
      coalesce(p_scopes, '{}'::text[]),
      p_expires_at
    );
  end if;
end;
$$;

revoke all on function private.store_oauth_tokens(uuid, text, text, text, timestamptz, text[]) from public;
grant execute on function private.store_oauth_tokens(uuid, text, text, text, timestamptz, text[]) to service_role;

create or replace function private.read_oauth_tokens(p_user_id uuid, p_org_slug text)
returns table (
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scopes text[],
  vault_secret_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (ds.decrypted_secret::json ->> 'access_token'),
    (ds.decrypted_secret::json ->> 'refresh_token'),
    oc.expires_at,
    oc.scopes,
    oc.vault_secret_id
  from public.oauth_connections as oc
  join vault.decrypted_secrets as ds
    on ds.id = oc.vault_secret_id
  where oc.user_id = p_user_id
    and oc.org_slug = p_org_slug;
$$;

revoke all on function private.read_oauth_tokens(uuid, text) from public;
grant execute on function private.read_oauth_tokens(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- bump conversations.updated_at when a message is inserted
-- ---------------------------------------------------------------------------

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

create trigger messages_bump_conversation_updated_at
  after insert on public.messages
  for each row
  execute function private.bump_conversation_updated_at();
