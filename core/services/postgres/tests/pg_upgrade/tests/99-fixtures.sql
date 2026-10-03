-- enable JIT to ensure the upgrade process disables it
alter system set jit = on;
alter system set password_encryption = 'md5';
select pg_reload_conf();

-- create materialized view
create materialized view public.european_countries as
    select * from public.countries where continent = 'Europe'
with no data;
refresh materialized view public.european_countries;

select count(*) from public.european_countries;

-- simulate a project created before the trigger rescope migrations: the
-- fleet-wide function updates left these projects with triggers still scoped
-- to their original tags, so recreating the extensions no longer re-applies
-- their wiring (graphql_public.graphql wrapper, cron grants). The upgrade
-- must rescope both to CREATE EXTENSION.
drop event trigger if exists issue_pg_graphql_access;
create event trigger issue_pg_graphql_access
    on ddl_command_end
    when tag in ('CREATE FUNCTION')
    execute procedure extensions.grant_pg_graphql_access();
drop event trigger if exists issue_pg_cron_access;
create event trigger issue_pg_cron_access
    on ddl_command_end
    when tag in ('CREATE SCHEMA')
    execute procedure extensions.grant_pg_cron_access();
