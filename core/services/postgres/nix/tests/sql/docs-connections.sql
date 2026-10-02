-- testing sql found in https://supabase.com/docs/guides/database/connection-management
-- we can't test every sql statement in this doc because their results won't be deterministic
select
  ssl,
  datname as database,
  usename as connected_role,
  application_name,
  query,
  state
from pg_stat_ssl
join pg_stat_activity
on pg_stat_ssl.pid = pg_stat_activity.pid;
