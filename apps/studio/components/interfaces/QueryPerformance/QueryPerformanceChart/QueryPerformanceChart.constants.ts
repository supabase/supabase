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
