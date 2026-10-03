grant usage on schema cron to postgres with grant option;
grant all on all functions in schema cron to postgres with grant option;

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
