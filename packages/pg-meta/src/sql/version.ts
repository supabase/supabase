export const VERSION_SQL = /* SQL */ `
-- source: dashboard
-- description: Fetch PostgreSQL version, active connections, and max connections
select
  version(),
  current_setting('server_version_num')::int8 as version_number,
  (
    select
      count(*) as active_connections
    from
      pg_stat_activity
  ) as active_connections,
  current_setting('max_connections')::int8 as max_connections
`
