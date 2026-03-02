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
  { id: 'application_name', name: 'Application', description: undefined, minWidth: 150 },
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

export const getSupamonitorLogsQuery = (startTime: string, endTime: string) =>
  `
select
  TIMESTAMP_TRUNC(sml.timestamp, MINUTE) as timestamp,
  CAST(sml_parsed.application_name AS STRING) as application_name,
  SUM(sml_parsed.calls) as calls,
  CAST(sml_parsed.database_name AS STRING) as database_name,
  CAST(sml_parsed.query AS STRING) as query,
  sml_parsed.query_id as query_id,
  SUM(sml_parsed.total_exec_time) as total_exec_time,
  SUM(sml_parsed.total_plan_time) as total_plan_time,
  CAST(sml_parsed.user_name AS STRING) as user_name,
  CASE WHEN SUM(sml_parsed.calls) > 0
    THEN SUM(sml_parsed.total_exec_time) / SUM(sml_parsed.calls)
    ELSE 0
  END as mean_exec_time,
  MIN(NULLIF(sml_parsed.total_exec_time, 0)) as min_exec_time,
  MAX(sml_parsed.total_exec_time) as max_exec_time,
  CASE WHEN SUM(sml_parsed.calls) > 0
    THEN SUM(sml_parsed.total_plan_time) / SUM(sml_parsed.calls)
    ELSE 0
  END as mean_plan_time,
  MIN(NULLIF(sml_parsed.total_plan_time, 0)) as min_plan_time,
  MAX(sml_parsed.total_plan_time) as max_plan_time,
  APPROX_QUANTILES(sml_parsed.total_exec_time, 100)[OFFSET(50)] as p50_exec_time,
  APPROX_QUANTILES(sml_parsed.total_exec_time, 100)[OFFSET(95)] as p95_exec_time,
  APPROX_QUANTILES(sml_parsed.total_plan_time, 100)[OFFSET(50)] as p50_plan_time,
  APPROX_QUANTILES(sml_parsed.total_plan_time, 100)[OFFSET(95)] as p95_plan_time
from supamonitor_logs as sml
cross join unnest(sml.metadata) as sml_metadata
cross join unnest(sml_metadata.supamonitor) as sml_parsed
WHERE sml.event_message = 'log'
  AND sml.timestamp >= CAST('${startTime}' AS TIMESTAMP)
  AND sml.timestamp <= CAST('${endTime}' AS TIMESTAMP)
GROUP BY timestamp, user_name, database_name, application_name, query_id, query
ORDER BY timestamp DESC
`.trim()
