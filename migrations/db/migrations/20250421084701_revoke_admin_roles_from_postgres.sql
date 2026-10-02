-- migrate:up
revoke supabase_storage_admin from postgres;
do $$
begin
  if exists (select from pg_namespace where nspname = 'storage') then
    revoke create on schema storage from postgres;
  end if;
end $$;
do $$
begin
  if exists (select from pg_class where relnamespace = (select oid from pg_namespace where nspname = 'storage') and relname = 'migrations') then
    revoke all on storage.migrations from anon, authenticated, service_role, postgres;
  end if;
end $$;

revoke supabase_auth_admin from postgres;
revoke create on schema auth from postgres;
do $$
begin
  if exists (select from pg_class where relnamespace = 'auth'::regnamespace and relname = 'schema_migrations') then
    revoke all on auth.schema_migrations from dashboard_user, postgres;
  end if;
end $$;

-- migrate:down
