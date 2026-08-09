import { safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getPgStatActivitySql = (): SafeSqlFragment => {
  return safeSql`
select
  a.pid,
  a.usename as role_name,
  a.application_name,
  a.state,
  a.query,
  a.wait_event_type,
  a.wait_event,
  a.xact_start as transaction_start,
  a.query_start,
  a.state_change,
  pg_blocking_pids(a.pid) as blocked_by
from pg_stat_activity a
where a.datname = current_database()
  and a.pid <> pg_backend_pid()
  and a.backend_type = 'client backend'
order by a.query_start asc nulls last;
`
}
