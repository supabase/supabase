-- Photo Wall: shared walls of photos, stored in Supabase Storage.
--
-- Access model: a wall is visible to its members. Anyone with a wall's id (the
-- invite link) can join it. Members can add photos; people can delete their
-- own. Photo files live in the public `photos` bucket under `<wall id>/`, so
-- the CDN and image transformations can serve them.

create schema if not exists private;

create table public.walls (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.wall_members (
  wall_id uuid not null references public.walls (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (wall_id, user_id)
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  wall_id uuid not null references public.walls (id) on delete cascade,
  -- Object path in the `photos` bucket: `<wall id>/<photo id>.<ext>`
  path text not null unique,
  caption text check (char_length(caption) <= 140),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (path like wall_id::text || '/%')
);

create index walls_created_by_idx on public.walls (created_by);
create index wall_members_user_id_idx on public.wall_members (user_id);
create index photos_wall_id_created_at_idx on public.photos (wall_id, created_at desc);
create index photos_created_by_idx on public.photos (created_by);
create index photos_created_at_idx on public.photos (created_at);

-- Membership check used by the policies below. Security definer so the
-- wall_members policy can call it without recursing into itself.
create function private.is_wall_member(target_wall_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wall_members
    where wall_id = target_wall_id
      and user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_wall_member(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_wall_member(uuid) to authenticated;

-- The creator becomes the first member.
create function private.add_wall_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.wall_members (wall_id, user_id)
  values (new.id, new.created_by)
  on conflict do nothing;
  return new;
end;
$$;

revoke all on function private.add_wall_creator() from public;

create trigger on_wall_created
after insert on public.walls
for each row execute function private.add_wall_creator();

alter table public.walls enable row level security;
alter table public.wall_members enable row level security;
alter table public.photos enable row level security;

-- New tables aren't exposed to the Data API without explicit grants (the
-- default for new projects), so grant exactly what the policies below allow.
grant select, insert, update, delete on public.walls to authenticated;
grant select, insert, delete on public.wall_members to authenticated;
grant select, insert, update, delete on public.photos to authenticated;
-- The cleanup Edge Function reads walls and deletes photos with the secret key.
grant select on public.walls to service_role;
grant select, delete on public.photos to service_role;

-- Walls
create policy "Members can view walls"
on public.walls for select
to authenticated
using (created_by = (select auth.uid()) or (select private.is_wall_member(id)));

create policy "Users can create walls they own"
on public.walls for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy "Owners can rename walls"
on public.walls for update
to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "Owners can delete walls"
on public.walls for delete
to authenticated
using (created_by = (select auth.uid()));

-- Wall members
create policy "Members can view the member list"
on public.wall_members for select
to authenticated
using ((select private.is_wall_member(wall_id)));

create policy "Users can join a wall with its link"
on public.wall_members for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can leave a wall"
on public.wall_members for delete
to authenticated
using (user_id = (select auth.uid()));

-- Photos
create policy "Members can view photos"
on public.photos for select
to authenticated
using ((select private.is_wall_member(wall_id)));

create policy "Members can add photos"
on public.photos for insert
to authenticated
with check ((select private.is_wall_member(wall_id)) and created_by = (select auth.uid()));

create policy "Uploaders can edit their captions"
on public.photos for update
to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "Uploaders can delete their photos"
on public.photos for delete
to authenticated
using (created_by = (select auth.uid()));

-- Storage: a public bucket (files are served by URL, through the CDN), with
-- size and type limits enforced by Storage itself.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Upload rate limit: at most 30 uploads per user per hour.
create function private.recent_upload_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from storage.objects
  where bucket_id = 'photos'
    and owner_id = (select auth.uid())::text
    and created_at > now() - interval '1 hour';
$$;

revoke all on function private.recent_upload_count() from public;
grant execute on function private.recent_upload_count() to authenticated;

create policy "Members can upload to their walls"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'photos'
  and (select private.is_wall_member(((storage.foldername(name))[1])::uuid))
  and (select private.recent_upload_count()) < 30
);

-- Storage's remove() needs select as well as delete on the object.
create policy "Uploaders can read their files"
on storage.objects for select
to authenticated
using (bucket_id = 'photos' and owner_id = (select auth.uid())::text);

create policy "Uploaders can delete their files"
on storage.objects for delete
to authenticated
using (bucket_id = 'photos' and owner_id = (select auth.uid())::text);

-- For the cleanup Edge Function (secret key only): files in the bucket that
-- have no photos row, such as an upload whose row was never saved, and every
-- file a user owns. Storage won't delete a user who still owns files.
create function public.orphaned_photo_files(older_than timestamptz)
returns setof text
language sql
stable
set search_path = ''
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'photos'
    and o.created_at < older_than
    and not exists (select 1 from public.photos p where p.path = o.name);
$$;

create function public.photo_files_owned_by(owner uuid)
returns setof text
language sql
stable
set search_path = ''
as $$
  select name from storage.objects where bucket_id = 'photos' and owner_id = owner::text;
$$;

revoke all on function public.orphaned_photo_files(timestamptz) from public, anon, authenticated;
revoke all on function public.photo_files_owned_by(uuid) from public, anon, authenticated;
grant execute on function public.orphaned_photo_files(timestamptz) to service_role;
grant execute on function public.photo_files_owned_by(uuid) to service_role;

-- Stream new and deleted photos to wall members over Realtime.
alter publication supabase_realtime add table public.photos;

-- Retention: every night, a Cron job calls the `cleanup` Edge Function, which
-- deletes photos older than RETENTION_DAYS (rows and files). It reads the
-- project URL and secret key from Vault; see the README for the two
-- `vault.create_secret` calls.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'photo-wall-cleanup',
  '0 3 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/cleanup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'secret_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
