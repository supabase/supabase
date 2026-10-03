BEGIN;
-- create cron extension as supabase_admin
create extension if not exists pg_cron;

-- \ir migrations/db/init-scripts/00000000000003-post-setup.sql
grant usage on schema cron to postgres with grant option;
alter default privileges in schema cron grant all on tables to postgres with grant option;
alter default privileges in schema cron grant all on routines to postgres with grant option;
alter default privileges in schema cron grant all on sequences to postgres with grant option;
grant all privileges on all tables in schema cron to postgres with grant option;
grant all privileges on all routines in schema cron to postgres with grant option;
grant all privileges on all sequences in schema cron to postgres with grant option;

-- postgres role should have access
set local role postgres;
select * from cron.job;

-- other roles can be granted access
grant usage on schema cron to authenticated;
grant select on all tables in schema cron to authenticated;

-- authenticated role should have access now
set local role authenticated;
select * from cron.job;
ROLLBACK;
