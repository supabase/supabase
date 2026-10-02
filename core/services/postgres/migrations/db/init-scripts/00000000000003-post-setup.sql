-- migrate:up

ALTER ROLE supabase_admin SET search_path TO "\$user",public,auth,extensions;
ALTER ROLE postgres SET search_path TO "\$user",public,extensions;

-- Trigger for pg_cron
CREATE OR REPLACE FUNCTION extensions.grant_pg_cron_access()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
  schema_is_cron bool;
BEGIN
  schema_is_cron = (
    SELECT n.nspname = 'cron'
    FROM pg_event_trigger_ddl_commands() AS ev
    LEFT JOIN pg_catalog.pg_namespace AS n
      ON ev.objid = n.oid
  );

  IF schema_is_cron
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;

  END IF;

END;
$$;
CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end WHEN TAG in ('CREATE SCHEMA')
EXECUTE PROCEDURE extensions.grant_pg_cron_access();
COMMENT ON FUNCTION extensions.grant_pg_cron_access IS 'Grants access to pg_cron';

-- Event trigger for pg_net
CREATE OR REPLACE FUNCTION extensions.grant_pg_net_access()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

    REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

    GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
  END IF;
END;
$$;
COMMENT ON FUNCTION extensions.grant_pg_net_access IS 'Grants access to pg_net';

DO
$$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_event_trigger
    WHERE evtname = 'issue_pg_net_access'
  ) THEN
    CREATE EVENT TRIGGER issue_pg_net_access
    ON ddl_command_end
    WHEN TAG IN ('CREATE EXTENSION')
    EXECUTE PROCEDURE extensions.grant_pg_net_access();
  END IF;
END
$$;

-- Supabase dashboard user
CREATE ROLE dashboard_user NOSUPERUSER CREATEDB CREATEROLE REPLICATION;
GRANT ALL ON DATABASE postgres TO dashboard_user;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT ALL ON SCHEMA extensions TO dashboard_user;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO dashboard_user;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO dashboard_user;
-- GRANT ALL ON ALL TABLES IN SCHEMA storage TO dashboard_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO dashboard_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA extensions TO dashboard_user;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO dashboard_user;
GRANT ALL ON ALL ROUTINES IN SCHEMA extensions TO dashboard_user;
do $$
begin
  if exists (select from pg_namespace where nspname = 'storage') then
    GRANT ALL ON SCHEMA storage TO dashboard_user;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO dashboard_user;
    GRANT ALL ON ALL ROUTINES IN SCHEMA storage TO dashboard_user;
  end if;
end $$;

-- migrate:down
