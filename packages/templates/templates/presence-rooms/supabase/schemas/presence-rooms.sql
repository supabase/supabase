-- Durable room and membership state for Supabase Realtime Presence.
-- Use native Realtime Presence for ephemeral sync/join/leave events.

create table if not exists public.presence_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  metadata jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.presence_room_members (
  room_id uuid not null references public.presence_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

create table if not exists public.presence_room_heartbeats (
  room_id uuid not null references public.presence_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  presence_key text not null,
  status text not null default 'online' check (status in ('online', 'away', 'offline')),
  metadata jsonb not null default '{}',
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 minutes',
  primary key (room_id, presence_key)
);

create index if not exists presence_room_members_user_id_idx
on public.presence_room_members (user_id);

create index if not exists presence_room_heartbeats_room_seen_idx
on public.presence_room_heartbeats (room_id, last_seen_at desc);

alter table public.presence_rooms enable row level security;
alter table public.presence_room_members enable row level security;
alter table public.presence_room_heartbeats enable row level security;

create or replace function public.is_presence_room_member(
  room_id uuid,
  allowed_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.presence_room_members m
    where m.room_id = is_presence_room_member.room_id
      and m.user_id = auth.uid()
      and (
        is_presence_room_member.allowed_roles is null
        or m.role = any(is_presence_room_member.allowed_roles)
      )
  );
$$;

create policy "Room members can read rooms"
on public.presence_rooms for select
to authenticated
using (public.is_presence_room_member(id));

create policy "Authenticated users can create rooms"
on public.presence_rooms for insert
to authenticated
with check (created_by = auth.uid());

create policy "Room admins can update rooms"
on public.presence_rooms for update
to authenticated
using (public.is_presence_room_member(id, array['owner', 'admin']));

create policy "Room members can read memberships"
on public.presence_room_members for select
to authenticated
using (public.is_presence_room_member(room_id));

create policy "Room admins can manage memberships"
on public.presence_room_members for all
to authenticated
using (public.is_presence_room_member(room_id, array['owner', 'admin']))
with check (public.is_presence_room_member(room_id, array['owner', 'admin']));

create policy "Room members can read room heartbeats"
on public.presence_room_heartbeats for select
to authenticated
using (public.is_presence_room_member(room_id));

create policy "Users can update their own heartbeat"
on public.presence_room_heartbeats for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.create_presence_room(
  name text,
  slug text default null,
  metadata jsonb default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  room_id uuid;
begin
  insert into public.presence_rooms (name, slug, metadata, created_by)
  values (
    create_presence_room.name,
    create_presence_room.slug,
    create_presence_room.metadata,
    auth.uid()
  )
  returning id into room_id;

  insert into public.presence_room_members (room_id, user_id, role)
  values (room_id, auth.uid(), 'owner');

  return room_id;
end;
$$;

create or replace function public.touch_presence_room(
  room_id uuid,
  presence_key text,
  status text default 'online',
  metadata jsonb default '{}',
  ttl_seconds int default 120
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.presence_room_members m
    where m.room_id = touch_presence_room.room_id
      and m.user_id = auth.uid()
  ) then
    raise exception 'user is not a member of room %', room_id;
  end if;

  insert into public.presence_room_heartbeats (
    room_id,
    user_id,
    presence_key,
    status,
    metadata,
    last_seen_at,
    expires_at
  )
  values (
    touch_presence_room.room_id,
    auth.uid(),
    touch_presence_room.presence_key,
    touch_presence_room.status,
    touch_presence_room.metadata,
    now(),
    now() + make_interval(secs => greatest(touch_presence_room.ttl_seconds, 30))
  )
  on conflict (room_id, presence_key) do update
    set status = excluded.status,
        metadata = excluded.metadata,
        last_seen_at = excluded.last_seen_at,
        expires_at = excluded.expires_at;
end;
$$;

create or replace function public.cleanup_presence_room_heartbeats()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_count int;
begin
  update public.presence_room_heartbeats
  set status = 'offline'
  where status <> 'offline'
    and expires_at < now();

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

alter publication supabase_realtime add table public.presence_room_heartbeats;
