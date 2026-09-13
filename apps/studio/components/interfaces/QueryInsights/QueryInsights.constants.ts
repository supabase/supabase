export const SUPAMONITOR_EXCLUDED_ROLES = [
  'supabase_admin',
  'supabase_auth_admin',
  'supabase_storage_admin',
  'supabase_realtime_admin',
  'pgbouncer',
  'dashboard_user',
] as const

export const SUPAMONITOR_EXCLUDED_APP_NAMES = ['supabase-dashboard', 'mgmt-api'] as const

export const TRANSACTION_CONTROL_REGEX =
  /^\s*(BEGIN|COMMIT|ROLLBACK|SET\s|RESET\s|DISCARD|DEALLOCATE|SHOW\s)/i

export const SCHEMA_INTROSPECTION_REGEX =
  /\bFROM\s+(?:pg_catalog\.|information_schema\.|pg_class\b|pg_attribute\b|pg_type\b|pg_namespace\b)/i

export const getSupamonitorLogsQuery = (startTime: string, endTime: string) => {
  // Validate and canonicalize to ISO 8601 UTC before embedding in SQL.
  // new Date().toISOString() throws RangeError on invalid input and always
  // produces "YYYY-MM-DDTHH:mm:ss.mmmZ" which contains no SQL special characters.
  const safeStart = new Date(startTime).toISOString()
  const safeEnd = new Date(endTime).toISOString()

  return `
-- This query is run by Supabase Query Insights to aggregate pg_stat_statements
-- data collected by the supamonitor extension. It reads from Logflare and groups
-- execution metrics (timing, call counts, percentiles) by query and minute so
-- the dashboard can surface slow queries, high-call patterns, and planning overhead.
-- If you see this query in your logs, it is a read-only analytics query and safe to ignore.
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
  AND sml.timestamp >= CAST('${safeStart}' AS TIMESTAMP)
  AND sml.timestamp <= CAST('${safeEnd}' AS TIMESTAMP)
GROUP BY timestamp, user_name, database_name, application_name, query_id, query
ORDER BY timestamp DESC
`.trim()
}
