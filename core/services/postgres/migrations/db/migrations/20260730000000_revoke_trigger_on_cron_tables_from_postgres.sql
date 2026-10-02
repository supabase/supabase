-- migrate:up

-- postgres is granted ALL on the cron tables via `grant all ... in schema cron to
-- postgres`, which includes TRIGGER on cron.job_run_details. postgres does not need to
-- create triggers on that table, so revoke TRIGGER there and stop grant_pg_cron_access()
-- from re-granting it on a later CREATE EXTENSION (which re-runs `grant all`). cron.job is
-- already SELECT-only for postgres.
--
-- The grant is made WITH GRANT OPTION, so postgres may have re-granted TRIGGER onward to
-- another role; a plain REVOKE then fails with "dependent privileges exist". REVOKE ...
-- CASCADE handles that case (and removes the re-granted privilege too).

do $$
begin
  if exists (select from pg_extension where extname = 'pg_cron') then
    revoke trigger on cron.job_run_details from postgres cascade;
  end if;
end $$;

CREATE OR REPLACE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
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
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
    revoke trigger on cron.job_run_details from postgres cascade;
  END IF;
END;
$$;

-- migrate:down
