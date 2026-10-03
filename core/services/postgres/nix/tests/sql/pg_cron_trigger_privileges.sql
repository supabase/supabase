-- Regression test: postgres should not hold TRIGGER on the cron tables.
--
-- postgres is granted ALL on the cron schema, so without the fix it also gets TRIGGER on
-- cron.job_run_details, which it does not need. Creating the extension fires
-- extensions.grant_pg_cron_access(), which grants postgres access to the cron schema and
-- then revokes TRIGGER on cron.job_run_details. This test asserts postgres ends up without
-- TRIGGER on either cron table (cron.job is already SELECT-only) while keeping SELECT. It
-- runs inside a transaction that is rolled back, so creating pg_cron here does not pollute
-- the shared regression database (the roles and extension-enumeration tests run
-- afterwards). Silent on success, raises on regression.
begin;

set local client_min_messages = warning;

create extension if not exists pg_cron;

do $$
begin
  if has_table_privilege('postgres', 'cron.job_run_details', 'TRIGGER') then
    raise exception 'postgres still has TRIGGER on cron.job_run_details';
  end if;
  if has_table_privilege('postgres', 'cron.job', 'TRIGGER') then
    raise exception 'postgres still has TRIGGER on cron.job';
  end if;
  if not has_table_privilege('postgres', 'cron.job_run_details', 'SELECT') then
    raise exception 'postgres unexpectedly lost SELECT on cron.job_run_details';
  end if;
end
$$;

rollback;

-- A delegated (dependent) TRIGGER grant must not break the revoke. postgres holds TRIGGER
-- WITH GRANT OPTION, so it can re-grant TRIGGER on cron.job_run_details to another role. A
-- plain REVOKE then fails with a "dependent privileges exist" (class 2B) error, so the
-- revoke uses CASCADE. This reproduces that state and asserts CASCADE clears TRIGGER from
-- postgres and the delegated role. Rolled back; silent on success.
begin;

set local client_min_messages = warning;

create extension if not exists pg_cron;

grant trigger on cron.job_run_details to postgres with grant option;

create role cron_trigger_dep_test;

set local role postgres;

grant trigger on cron.job_run_details to cron_trigger_dep_test;

reset role;

do $$
begin
  begin
    revoke trigger on cron.job_run_details from postgres;
    raise exception 'plain REVOKE unexpectedly succeeded despite a dependent grant';
  exception when others then
    if sqlstate not like '2B%' then raise; end if;
  end;
end
$$;

revoke trigger on cron.job_run_details from postgres cascade;

do $$
begin
  if has_table_privilege('postgres', 'cron.job_run_details', 'TRIGGER') then
    raise exception 'postgres still has TRIGGER after CASCADE revoke';
  end if;
  if has_table_privilege('cron_trigger_dep_test', 'cron.job_run_details', 'TRIGGER') then
    raise exception 'delegated role still has TRIGGER after CASCADE revoke';
  end if;
end
$$;

rollback;

-- The shipped grant_pg_cron_access() must revoke TRIGGER with CASCADE, so a re-granted
-- privilege cannot block it on a future CREATE EXTENSION.
do $$
begin
  if pg_get_functiondef('extensions.grant_pg_cron_access()'::regprocedure)
       not ilike '%job_run_details from postgres cascade%' then
    raise exception 'grant_pg_cron_access() no longer revokes TRIGGER with CASCADE';
  end if;
end
$$;
