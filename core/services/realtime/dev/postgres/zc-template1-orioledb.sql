-- A new database is copied from template1, so `mix ecto.create` only yields a usable database on
-- the orioledb image if template1 carries the extension that provides the default access method.
--
-- Separate from zb-supabase-schema.sql because it reaches a second database: a
-- Multigres cluster serves only the databases in its topology, so it can apply
-- zb but not this.
\connect template1 supabase_admin

do $$
begin
  if exists (select from pg_available_extensions where name = 'orioledb') then
    execute 'create extension if not exists orioledb';
  end if;
end$$;
