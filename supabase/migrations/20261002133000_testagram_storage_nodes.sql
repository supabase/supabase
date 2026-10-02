-- Testagram hybrid storage control plane.
create extension if not exists pgcrypto;

create table if not exists public.storage_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_name text not null check (length(trim(device_name)) between 1 and 120),
  platform text not null check (platform in ('windows', 'linux', 'macos', 'android', 'ios', 'other')),
  agent_version text not null check (length(agent_version) between 1 and 64),
  status text not null default 'offline' check (status in ('pending', 'online', 'offline', 'revoked')),
  last_seen_at timestamptz,
  storage_capacity_bytes bigint not null default 0 check (storage_capacity_bytes >= 0),
  storage_used_bytes bigint not null default 0 check (storage_used_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  node_secret_hash text,
  node_secret_rotated_at timestamptz
);
create index if not exists storage_nodes_user_id_idx on public.storage_nodes(user_id);
create index if not exists storage_nodes_status_idx on public.storage_nodes(status);

create table if not exists public.storage_node_roots (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.storage_nodes(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 120),
  root_identifier text not null check (root_identifier ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$'),
  enabled boolean not null default false,
  read_allowed boolean not null default true,
  write_allowed boolean not null default false,
  delete_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(node_id, root_identifier)
);
create index if not exists storage_node_roots_node_id_idx on public.storage_node_roots(node_id);

create table if not exists public.storage_node_pairings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists storage_node_pairings_user_id_idx on public.storage_node_pairings(user_id);
create index if not exists storage_node_pairings_expiry_idx on public.storage_node_pairings(expires_at);

create table if not exists public.storage_node_sessions (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.storage_nodes(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists storage_node_sessions_node_id_idx on public.storage_node_sessions(node_id);
create index if not exists storage_node_sessions_expiry_idx on public.storage_node_sessions(expires_at);

create table if not exists public.storage_node_commands (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.storage_nodes(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  operation text not null check (operation in ('stat', 'hash', 'mkdir', 'delete', 'write_base64', 'read_base64')),
  root_id uuid not null references public.storage_node_roots(id) on delete cascade,
  relative_path text not null check (
    length(relative_path) between 1 and 2048
    and relative_path !~ '(^|/)\.\.(/|$)'
    and relative_path !~ '^/'
    and relative_path !~ '(^|/)\\'
  ),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'claimed', 'completed', 'failed', 'cancelled')),
  result jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz
);
create index if not exists storage_node_commands_claim_idx on public.storage_node_commands(node_id, status, created_at);
create index if not exists storage_node_commands_owner_idx on public.storage_node_commands(owner_id, created_at desc);

create table if not exists public.storage_objects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_class text not null check (storage_class in ('server', 'local_node')),
  bucket_id text,
  object_key text,
  node_id uuid references public.storage_nodes(id) on delete set null,
  root_id uuid references public.storage_node_roots(id) on delete set null,
  filename text not null check (length(filename) between 1 and 1024),
  mime_type text,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  etag text,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  state text not null default 'pending' check (state in ('pending','available_local','available_server','local_and_server','offline','deleted','error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (storage_class = 'server' and node_id is null and root_id is null and bucket_id is not null and object_key is not null)
    or
    (storage_class = 'local_node' and node_id is not null and root_id is not null)
  ),
  check (object_key is null or (
    length(object_key) between 1 and 2048
    and object_key !~ '(^|/)\.\.(/|$)'
    and object_key !~ '^/'
  ))
);
create index if not exists storage_objects_owner_idx on public.storage_objects(owner_id, created_at desc);
create index if not exists storage_objects_node_idx on public.storage_objects(node_id, state);

create or replace function public.storage_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists storage_nodes_touch_updated_at on public.storage_nodes;
create trigger storage_nodes_touch_updated_at before update on public.storage_nodes
for each row execute function public.storage_touch_updated_at();

drop trigger if exists storage_node_roots_touch_updated_at on public.storage_node_roots;
create trigger storage_node_roots_touch_updated_at before update on public.storage_node_roots
for each row execute function public.storage_touch_updated_at();

drop trigger if exists storage_objects_touch_updated_at on public.storage_objects;
create trigger storage_objects_touch_updated_at before update on public.storage_objects
for each row execute function public.storage_touch_updated_at();

alter table public.storage_nodes enable row level security;
alter table public.storage_node_roots enable row level security;
alter table public.storage_node_pairings enable row level security;
alter table public.storage_node_sessions enable row level security;
alter table public.storage_node_commands enable row level security;
alter table public.storage_objects enable row level security;

drop policy if exists storage_nodes_owner_select on public.storage_nodes;
create policy storage_nodes_owner_select on public.storage_nodes for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists storage_nodes_owner_update on public.storage_nodes;
create policy storage_nodes_owner_update on public.storage_nodes for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists storage_node_roots_owner_select on public.storage_node_roots;
create policy storage_node_roots_owner_select on public.storage_node_roots for select to authenticated
using (exists (
  select 1 from public.storage_nodes n
  where n.id = storage_node_roots.node_id and n.user_id = (select auth.uid())
));

drop policy if exists storage_objects_owner_select on public.storage_objects;
create policy storage_objects_owner_select on public.storage_objects for select to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists storage_objects_owner_update on public.storage_objects;
create policy storage_objects_owner_update on public.storage_objects for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists storage_objects_owner_delete on public.storage_objects;
create policy storage_objects_owner_delete on public.storage_objects for delete to authenticated
using ((select auth.uid()) = owner_id);

revoke all on public.storage_node_pairings from anon, authenticated;
revoke all on public.storage_node_sessions from anon, authenticated;
revoke all on public.storage_node_commands from anon, authenticated;

grant select, update on public.storage_nodes to authenticated;
grant select on public.storage_node_roots to authenticated;
grant select, update, delete on public.storage_objects to authenticated;
grant all on public.storage_nodes, public.storage_node_roots, public.storage_node_pairings,
  public.storage_node_sessions, public.storage_node_commands, public.storage_objects to service_role;
