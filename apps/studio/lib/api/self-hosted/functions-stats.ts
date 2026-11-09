import { z } from 'zod'

import { toIsoTimestamp } from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionRecentErrors.utils'
import { analyticsLiteral as lit, safeSql } from '@/data/logs/safe-analytics-sql'

const statsParamsSchema = z.object({
  function_id: z.string().min(1),
  interval: z.enum(['15min', '1hr', '3hr', '1day']),
})
const INTERVAL_MINUTES = { '15min': 15, '1hr': 60, '3hr': 180, '1day': 1440 }

/** Logflare's Postgres translator requires independent source aggregates. */
export function getFunctionsStatsParams(params: unknown, now = new Date()) {
  const { function_id, interval } = statsParamsSchema.parse(params)
  const bucket = interval === '1day' ? safeSql`HOUR` : safeSql`MINUTE`
  const requestSql = safeSql`-- self-hosted function invocation and worker measurements
    SELECT TIMESTAMP_TRUNC(l.timestamp, ${bucket}) AS timestamp,
      COUNT(*) AS requests_count, 0 AS worker_count,
      COUNTIF(response.status_code < 300) AS success_count,
      COUNTIF(response.status_code BETWEEN 300 AND 399) AS redirect_count,
      COUNTIF(response.status_code BETWEEN 400 AND 499) AS client_err_count,
      COUNTIF(response.status_code >= 500) AS server_err_count,
      AVG(CAST(m.execution_time_ms AS NUMERIC)) AS avg_execution_time,
      MAX(CAST(m.execution_time_ms AS NUMERIC)) AS max_execution_time,
      CAST(NULL AS NUMERIC) AS avg_cpu_time_used, CAST(NULL AS NUMERIC) AS max_cpu_time_used,
      CAST(NULL AS NUMERIC) AS avg_memory_used, CAST(NULL AS NUMERIC) AS avg_heap_memory_used,
      CAST(NULL AS NUMERIC) AS avg_external_memory_used
    FROM function_edge_logs AS l CROSS JOIN UNNEST(l.metadata) AS m
      CROSS JOIN UNNEST(m.response) AS response
    WHERE m.function_id = ${lit(function_id)} GROUP BY 1 LIMIT 1441`
  const runtimeSql = safeSql`SELECT TIMESTAMP_TRUNC(runtime_log.timestamp, ${bucket}) AS timestamp,
      0 AS requests_count, COUNT(*) AS worker_count,
      0 AS success_count, 0 AS redirect_count, 0 AS client_err_count, 0 AS server_err_count,
      CAST(NULL AS NUMERIC) AS avg_execution_time, CAST(NULL AS NUMERIC) AS max_execution_time,
      AVG(CAST(runtime_metadata.cpu_time_used AS NUMERIC)) AS avg_cpu_time_used,
      MAX(CAST(runtime_metadata.cpu_time_used AS NUMERIC)) AS max_cpu_time_used,
      AVG(CAST(memory.total AS NUMERIC)) / 1048576.0 AS avg_memory_used,
      AVG(CAST(memory.heap AS NUMERIC)) / 1048576.0 AS avg_heap_memory_used,
      AVG(CAST(memory.external AS NUMERIC)) / 1048576.0 AS avg_external_memory_used
    FROM function_logs AS runtime_log CROSS JOIN UNNEST(runtime_log.metadata) AS runtime_metadata
      CROSS JOIN UNNEST(runtime_metadata.memory_used) AS memory
    WHERE runtime_metadata.function_id = ${lit(function_id)} AND runtime_metadata.event_type = 'Shutdown' GROUP BY 1
    LIMIT 1441`
  return [requestSql, runtimeSql].map((sql) => ({
    sql,
    iso_timestamp_start: new Date(
      now.getTime() - INTERVAL_MINUTES[interval] * 60_000
    ).toISOString(),
    iso_timestamp_end: now.toISOString(),
  }))
}

const numeric = z.union([z.number(), z.string()]).pipe(z.coerce.number().finite())
const rowSchema = z.object({
  timestamp: z.union([z.string(), z.number()]),
  requests_count: numeric,
  worker_count: numeric,
  success_count: numeric,
  redirect_count: numeric,
  client_err_count: numeric,
  server_err_count: numeric,
  avg_execution_time: numeric.nullable(),
  max_execution_time: numeric.nullable(),
  avg_cpu_time_used: numeric.nullable(),
  max_cpu_time_used: numeric.nullable(),
  avg_memory_used: numeric.nullable(),
  avg_heap_memory_used: numeric.nullable(),
  avg_external_memory_used: numeric.nullable(),
})

export function combineFunctionsStats(result: unknown) {
  const buckets = new Map<string, z.infer<typeof rowSchema>>()
  for (const row of z.array(rowSchema).parse(result)) {
    const timestamp = toIsoTimestamp(row.timestamp)
    if (!timestamp) throw new Error('Invalid function stats timestamp')
    const previous = buckets.get(timestamp)
    if (!previous) {
      buckets.set(timestamp, { ...row, timestamp })
      continue
    }
    for (const key of [
      'requests_count',
      'worker_count',
      'success_count',
      'redirect_count',
      'client_err_count',
      'server_err_count',
    ] as const) {
      previous[key] += row[key]
    }
    for (const key of [
      'avg_execution_time',
      'max_execution_time',
      'avg_cpu_time_used',
      'max_cpu_time_used',
      'avg_memory_used',
      'avg_heap_memory_used',
      'avg_external_memory_used',
    ] as const) {
      previous[key] ??= row[key]
    }
  }
  return [...buckets.values()].sort((a, b) =>
    String(a.timestamp).localeCompare(String(b.timestamp))
  )
}
