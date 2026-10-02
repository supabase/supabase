do $$
declare
  super_user text = coalesce(current_setting('storage.super_user', true), 'postgres');
begin
  execute 'grant all on storage.buckets, storage.objects to ' || super_user || ' with grant option';
end $$;

do $$
declare
  anon_role text = coalesce(current_setting('storage.anon_role', true), 'anon');
  authenticated_role text = coalesce(current_setting('storage.authenticated_role', true), 'authenticated');
  service_role text = coalesce(current_setting('storage.service_role', true), 'service_role');
begin
  execute 'grant all on storage.buckets, storage.objects to ' || service_role || ', ' || authenticated_role || ', ' || anon_role;
end $$;
