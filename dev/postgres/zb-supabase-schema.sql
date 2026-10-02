\connect - supabase_admin

do $$
begin
  if not exists (select from pg_roles where rolname = 'supabase_realtime_admin') then
    create role supabase_realtime_admin with noinherit nologin noreplication;
  end if;
end$$;

create schema if not exists _realtime;

alter user supabase_realtime_admin set search_path = public, extensions, realtime;
grant create on database postgres to supabase_realtime_admin;
do $$
begin
  if current_setting('server_version_num')::int >= 150000 then
    execute 'grant set on parameter log_min_messages to supabase_realtime_admin';
  end if;
end$$;
grant anon, authenticated, service_role to supabase_realtime_admin;
grant create, usage on schema public to supabase_realtime_admin;
grant usage on schema extensions to supabase_realtime_admin;
grant usage on schema auth to supabase_realtime_admin;
grant execute on all functions in schema auth to supabase_realtime_admin;
grant usage on schema realtime to postgres, anon, authenticated, service_role;
grant all on schema realtime to supabase_realtime_admin;
grant create, usage on schema _realtime to supabase_realtime_admin;
