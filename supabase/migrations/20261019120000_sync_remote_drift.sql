-- Brings the migrations in line with objects that exist on the remote project but were
-- created outside of migrations. Idempotent, so it is safe to apply to the remote.

-- extensions
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_stat_monitor with schema extensions;

-- storage policies for integrations images
drop policy if exists "Allow anon users to select and insert files oi12w6_0" on storage.objects;
create policy "Allow anon users to select and insert files oi12w6_0" on storage.objects
  for select to anon
  using (bucket_id = 'integrations-images');

drop policy if exists "Allow anon users to select and insert files oi12w6_1" on storage.objects;
create policy "Allow anon users to select and insert files oi12w6_1" on storage.objects
  for insert to anon
  with check (bucket_id = 'integrations-images');

drop policy if exists "Allow anon users to upload and view images 7lkd21_0" on storage.objects;
create policy "Allow anon users to upload and view images 7lkd21_0" on storage.objects
  for insert to anon
  with check (bucket_id = 'temp-for-testing-integrations');

drop policy if exists "Allow anon users to upload and view images 7lkd21_1" on storage.objects;
create policy "Allow anon users to upload and view images 7lkd21_1" on storage.objects
  for select to anon
  using (bucket_id = 'temp-for-testing-integrations');

-- publication used for data engineering
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'pub_data_engineering') then
    create publication pub_data_engineering
      for table public.feedback, public.feedback_comments, public.interfaces_feedback
      with (publish = 'insert, update, delete, truncate');
  end if;
end
$$;

-- launch week tickets: column-level privileges for authenticated users
comment on column public.tickets.id is 'Launch Week tickets';

revoke all on table public.tickets from authenticated;

revoke all (company) on table public.tickets from authenticated;
grant insert (company), update (company) on table public.tickets to authenticated;

revoke all (email) on table public.tickets from authenticated;
grant insert (email), update (email) on table public.tickets to authenticated;

revoke all (game_won_at) on table public.tickets from authenticated;
grant insert (game_won_at), update (game_won_at) on table public.tickets to authenticated;

revoke all (launch_week) on table public.tickets from authenticated;
grant insert (launch_week) on table public.tickets to authenticated;

revoke all (location) on table public.tickets from authenticated;
grant insert (location), update (location) on table public.tickets to authenticated;

revoke all (metadata) on table public.tickets from authenticated;
grant insert (metadata), update (metadata) on table public.tickets to authenticated;

revoke all (name) on table public.tickets from authenticated;
grant insert (name), update (name) on table public.tickets to authenticated;

revoke all (referred_by) on table public.tickets from authenticated;
grant insert (referred_by) on table public.tickets to authenticated;

revoke all (role) on table public.tickets from authenticated;
grant insert (role), update (role) on table public.tickets to authenticated;

revoke all (shared_on_linkedin) on table public.tickets from authenticated;
grant insert (shared_on_linkedin), update (shared_on_linkedin) on table public.tickets to authenticated;

revoke all (shared_on_twitter) on table public.tickets from authenticated;
grant insert (shared_on_twitter), update (shared_on_twitter) on table public.tickets to authenticated;

revoke all (user_id) on table public.tickets from authenticated;
grant insert (user_id) on table public.tickets to authenticated;

revoke all (username) on table public.tickets from authenticated;
grant insert (username), update (username) on table public.tickets to authenticated;

grant references, select, trigger, truncate on table public.tickets to authenticated;
