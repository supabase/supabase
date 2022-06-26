-- migrate:up

/*
    Note: Up to supabase/posrtres:14.1.0.21 the following statements are already
    built into the dockerhub images. These statements must be idempotent to avoid
    errors
*/

-- https://github.com/supabase/postgres/blob/374b0ef6f23d22adc9ef99fba2276927269afecf/ansible/files/stat_extension.sql#L1
CREATE SCHEMA IF NOT exists extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements with schema extensions;

-- https://github.com/supabase/postgres/blob/374b0ef6f23d22adc9ef99fba2276927269afecf/ansible/files/pgbouncer_config/pgbouncer_auth_schema.sql#L1

do $do$
begin
    if not exists (
        select 1 from pg_catalog.pg_roles where rolname = 'pgbouncer'
    ) then

        create user pgbouncer;

    end if;
end;
$do$;

REVOKE ALL PRIVILEGES ON SCHEMA public FROM pgbouncer;

CREATE SCHEMA IF NOT EXISTS pgbouncer AUTHORIZATION pgbouncer;

CREATE OR REPLACE FUNCTION pgbouncer.get_auth(p_usename TEXT)
RETURNS TABLE(username TEXT, password TEXT) AS
$$
BEGIN
    RAISE WARNING 'PgBouncer auth request: %', p_usename;

    RETURN QUERY
    SELECT usename::TEXT, passwd::TEXT FROM pg_catalog.pg_shadow
    WHERE usename = p_usename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pgbouncer.get_auth(p_usename TEXT) TO pgbouncer;

-- migrate:down
