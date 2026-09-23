export enum LogsTableName {
  FN_EDGE = 'function_edge_logs',
  AUTH = 'auth_logs',
  POSTGRES = 'postgres_logs',
  REALTIME = 'realtime_logs',
  STORAGE = 'storage_logs',
  PG_CRON = 'pg_cron_logs',
  EDGE = 'edge_logs',
  FUNCTIONS = 'function_logs',
  POSTGREST = 'postgrest_logs',
  SUPAVISOR = 'supavisor_logs',
  PGBOUNCER = 'pgbouncer_logs',
  PG_UPGRADE = 'pg_upgrade_logs',
}

const logColumns: Record<LogsTableName, string> = {
  [LogsTableName.FN_EDGE]:
    "log_attributes['response.status_code'] as status_code, log_attributes['request.method'] as method, log_attributes['function_id'] as function_id, log_attributes['execution_time_ms'] as execution_time_ms, log_attributes['deployment_id'] as deployment_id, log_attributes['version'] as version",
  [LogsTableName.AUTH]:
    "log_attributes['level'] as level, log_attributes['status'] as status, log_attributes['path'] as path, log_attributes['msg'] as msg, log_attributes['error'] as error",
  [LogsTableName.POSTGRES]:
    "log_attributes['parsed.error_severity'] as error_severity, log_attributes['parsed.detail'] as detail, log_attributes['parsed.hint'] as hint",
  [LogsTableName.REALTIME]: '',
  [LogsTableName.STORAGE]: '',
  [LogsTableName.PG_CRON]:
    "log_attributes['parsed.error_severity'] as error_severity, log_attributes['parsed.query'] as query",
  [LogsTableName.EDGE]:
    "log_attributes['request.method'] as method, log_attributes['request.path'] as path, log_attributes['request.search'] as search, log_attributes['response.status_code'] as status_code",
  [LogsTableName.FUNCTIONS]:
    "log_attributes['event_type'] as event_type, log_attributes['function_id'] as function_id, log_attributes['level'] as level",
  [LogsTableName.POSTGREST]: '',
  [LogsTableName.SUPAVISOR]: '',
  [LogsTableName.PGBOUNCER]: '',
  [LogsTableName.PG_UPGRADE]: '',
}

export const genDefaultQuery = (table: LogsTableName, limit: number = 100) => {
  const source = table === LogsTableName.PG_CRON ? LogsTableName.POSTGRES : table
  const columns = logColumns[table]
  const cronFilter =
    table === LogsTableName.PG_CRON
      ? "\n  and (log_attributes['parsed.application_name'] = 'pg_cron' or event_message like '%cron job%')"
      : ''
  const rowLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 100

  return `select id, timestamp, event_message${columns ? `, ${columns}` : ''}
from logs
where source = '${source}'${cronFilter}
order by timestamp desc
limit ${rowLimit}`
}
