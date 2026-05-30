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

const genCrossJoinUnnests = (table: LogsTableName) => {
  switch (table) {
    case LogsTableName.EDGE:
      return `cross join unnest(metadata) as m
  cross join unnest(m.request) as request
  cross join unnest(m.response) as response`
    case LogsTableName.POSTGRES:
      return `cross join unnest(metadata) as m
  cross join unnest(m.parsed) as parsed`
    case LogsTableName.FUNCTIONS:
      return `cross join unnest(metadata) as metadata`
    case LogsTableName.AUTH:
      return `cross join unnest(metadata) as metadata`
    case LogsTableName.FN_EDGE:
      return `cross join unnest(metadata) as m
  cross join unnest(m.response) as response
  cross join unnest(m.request) as request`
    case LogsTableName.SUPAVISOR:
      return `cross join unnest(metadata) as m`
    default:
      return ''
  }
}

export const genDefaultQuery = (table: LogsTableName, limit: number = 100) => {
  const joins = genCrossJoinUnnests(table)
  const orderBy = 'order by timestamp desc'

  switch (table) {
    case LogsTableName.EDGE:
      return `select id, ${table}.timestamp, event_message, request.method, request.path, request.search, response.status_code
from ${table}
${joins}
${orderBy}
limit ${limit}`

    case LogsTableName.POSTGRES:
      return `select ${table}.timestamp, id, event_message, parsed.error_severity, parsed.detail, parsed.hint
from ${table}
${joins}
${orderBy}
limit ${limit}`

    case LogsTableName.FUNCTIONS:
      return `select id, ${table}.timestamp, event_message, metadata.event_type, metadata.function_id, metadata.level
from ${table}
${joins}
${orderBy}
limit ${limit}`

    case LogsTableName.AUTH:
      return `select id, ${table}.timestamp, event_message, metadata.level, metadata.status, metadata.path, metadata.msg as msg, metadata.error
from ${table}
${joins}
${orderBy}
limit ${limit}`

    case LogsTableName.FN_EDGE:
      return `select id, ${table}.timestamp, event_message, response.status_code, request.method, m.function_id, m.execution_time_ms, m.deployment_id, m.version
from ${table}
${joins}
${orderBy}
limit ${limit}`

    case LogsTableName.SUPAVISOR:
      return `select id, ${table}.timestamp, event_message
from ${table}
${joins}
${orderBy}
limit ${limit}`

    case LogsTableName.PG_UPGRADE:
      return `select id, ${table}.timestamp, event_message
from ${table}
${joins}
${orderBy}
limit ${limit}`

    case LogsTableName.PG_CRON:
      return `select postgres_logs.timestamp, id, event_message, parsed.error_severity, parsed.query
from postgres_logs
cross join unnest(metadata) as m
cross join unnest(m.parsed) as parsed
where (parsed.application_name = 'pg_cron' OR event_message LIKE '%cron job%')
${orderBy}
limit ${limit}`

    default:
      return `select id, ${table}.timestamp, event_message
from ${table}
${joins}
${orderBy}
limit ${limit}`
  }
}
