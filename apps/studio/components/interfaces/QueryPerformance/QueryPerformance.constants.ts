export enum QUERY_PERFORMANCE_REPORT_TYPES {
  MOST_TIME_CONSUMING = 'most_time_consuming',
  MOST_FREQUENT = 'most_frequent',
  SLOWEST_EXECUTION = 'slowest_execution',
  UNIFIED = 'unified',
}

export const QUERY_PERFORMANCE_PRESET_MAP = {
  [QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING]: 'mostTimeConsuming',
  [QUERY_PERFORMANCE_REPORT_TYPES.MOST_FREQUENT]: 'mostFrequentlyInvoked',
  [QUERY_PERFORMANCE_REPORT_TYPES.SLOWEST_EXECUTION]: 'slowestExecutionTime',
  [QUERY_PERFORMANCE_REPORT_TYPES.UNIFIED]: 'unified',
} as const

export const QUERY_PERFORMANCE_COLUMNS = [
  { id: 'query', name: 'Query', description: undefined, minWidth: 500 },
  { id: 'prop_total_time', name: 'Time consumed', description: undefined, minWidth: 150 },
  { id: 'calls', name: 'Calls', description: undefined, minWidth: 100 },
  { id: 'max_time', name: 'Max time', description: undefined, minWidth: 100 },
  { id: 'mean_time', name: 'Mean time', description: undefined, minWidth: 100 },
  { id: 'min_time', name: 'Min time', description: undefined, minWidth: 100 },
  { id: 'rows_read', name: 'Rows processed', description: undefined, minWidth: 130 },
  { id: 'cache_hit_rate', name: 'Cache hit rate', description: undefined, minWidth: 130 },
  { id: 'rolname', name: 'Role', description: undefined, minWidth: 200 },
] as const

export const QUERY_PERFORMANCE_ROLE_DESCRIPTION = [
  { name: 'postgres', description: 'The default Postgres role. This has admin privileges.' },
  {
    name: 'anon',
    description:
      'For unauthenticated, public access. This is the role which the API (PostgREST) will use when a user is not logged in.',
  },
  {
    name: 'authenticator',
    description:
      'A special role for the API (PostgREST). It has very limited access, and is used to validate a JWT and then "change into" another role determined by the JWT verification.',
  },
  {
    name: 'authenticated',
    description:
      'For "authenticated access." This is the role which the API (PostgREST) will use when a user is logged in.',
  },
  {
    name: 'service_role',
    description:
      'For elevated access. This role is used by the API (PostgREST) to bypass Row Level Security.',
  },
  {
    name: 'supabase_auth_admin',
    description:
      'Used by the Auth middleware to connect to the database and run migration. Access is scoped to the auth schema.',
  },
  {
    name: 'supabase_storage_admin',
    description:
      'Used by the Auth middleware to connect to the database and run migration. Access is scoped to the storage schema.',
  },
  { name: 'dashboard_user', description: 'For running commands via the Supabase UI.' },
  {
    name: 'supabase_admin',
    description:
      'An internal role Supabase uses for administrative tasks, such as running upgrades and automations.',
  },
  {
    name: 'pgbouncer',
    description:
      'PgBouncer is a lightweight connection pooler for PostgreSQL. Available on paid plans only.',
  },
] as const

export const QUERY_PERFORMANCE_CHART_TABS = [
  {
    id: 'query_latency',
    label: 'Query latency',
  },
  {
    id: 'rows_read',
    label: 'Rows read',
  },
  {
    id: 'calls',
    label: 'Calls',
  },
  {
    id: 'cache_hits',
    label: 'Cache hits',
  },
]

export const QUERY_PERFORMANCE_TIME_RANGES = [
  {
    id: 'last_60_minutes',
    label: 'Last 60 minutes',
  },
  {
    id: 'last_3_hours',
    label: 'Last 3 hours',
  },
  {
    id: 'last_24_hours',
    label: 'Last 24 hours',
  },
]

export const getPgStatMonitorLogsQuery = (startTime: string, endTime: string) =>
  `
select 
  id,
  pgl.timestamp as timestamp,
  'postgres' as log_type,
  CAST(pgl_parsed.sql_state_code AS STRING) as status,
  CASE
      WHEN pgl_parsed.error_severity = 'LOG' THEN 'success'
      WHEN pgl_parsed.error_severity = 'WARNING' THEN 'warning'
      WHEN pgl_parsed.error_severity = 'FATAL' THEN 'error'
      WHEN pgl_parsed.error_severity = 'ERROR' THEN 'error'
      ELSE null
  END as level,
  event_message as event_message
from postgres_logs as pgl
cross join unnest(pgl.metadata) as pgl_metadata
cross join unnest(pgl_metadata.parsed) as pgl_parsed
WHERE pgl.event_message LIKE '%[pg_stat_monitor]%'
  AND pgl.timestamp >= CAST('${startTime}' AS TIMESTAMP)
  AND pgl.timestamp <= CAST('${endTime}' AS TIMESTAMP)
ORDER BY timestamp DESC
`.trim()

export const PG_STAT_MONITOR_LOGS_QUERY = getPgStatMonitorLogsQuery(
  new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  new Date().toISOString()
)
