import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { queryInsightsKeys } from './keys'

export type QueryInsightsMetric = {
  timestamp: string
  value: number
  p50?: number
  p95?: number
  p99?: number
  p99_9?: number
}

export type QueryInsightsMetricDetail = {
  timestamp: string
  value?: number
  rows?: number
  cmd_type_text?: string
  database: string
  shared_blks_read?: number
  shared_blks_hit?: number
  shared_blks_dirtied?: number
  shared_blks_written?: number
  mean_exec_time?: number
  total_exec_time?: number
  p50?: number
  p95?: number
  p99?: number
  p99_9?: number
}

export type QueryInsightsQuery = {
  query_id: number
  query: string
  total_time: number
  calls: number
  rows_read: number
  rows_insert: number
  rows_update: number
  rows_delete: number
  shared_blks_read: number
  shared_blks_hit: number
  mean_exec_time: number
  database: string
  timestamp: string
  cmd_type_text: string
  application_name: string
  badness_score: number
  // index_advisor results
  startup_cost_before?: number
  startup_cost_after?: number
  total_cost_before?: number
  total_cost_after?: number
  index_statements?: string[]
  errors?: string[]
  // Error tracking fields
  error_count?: number
}

export type QueryInsightsMetricsVariables = {
  projectRef?: string
  connectionString?: string | null
  metric: 'rows_read' | 'query_latency' | 'queries_per_second' | 'calls' | 'cache_hits'
  startTime: string
  endTime: string
}

const getQueryInsightsMetricsSQL = (metric: string, startTime: string, endTime: string) => {
  switch (metric) {
    case 'rows_read':
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          SUM(rows) as value
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true
          AND cmd_type = 1
        GROUP BY bucket_start_time
        ORDER BY timestamp ASC
      `

    case 'query_latency':
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          percentile_cont(0.50) WITHIN GROUP (ORDER BY mean_exec_time) as p50,
          percentile_cont(0.95) WITHIN GROUP (ORDER BY mean_exec_time) as p95,
          percentile_cont(0.99) WITHIN GROUP (ORDER BY mean_exec_time) as p99,
          percentile_cont(0.999) WITHIN GROUP (ORDER BY mean_exec_time) as p99_9,
          AVG(mean_exec_time) as value
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true
        GROUP BY bucket_start_time
        ORDER BY timestamp ASC
      `

    case 'queries_per_second':
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          COUNT(*) / 300.0 as value
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true
        GROUP BY bucket_start_time
        ORDER BY timestamp ASC
      `

    case 'calls':
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          SUM(calls) as value
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true
        GROUP BY bucket_start_time
        ORDER BY timestamp ASC
      `

    case 'cache_hits':
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          CASE 
            WHEN SUM(shared_blks_read) > 0 THEN 
              (SUM(shared_blks_hit)::float / (SUM(shared_blks_hit) + SUM(shared_blks_read))::float) * 100
            ELSE 0 
          END as value
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true
        GROUP BY bucket_start_time
        ORDER BY timestamp ASC
      `

    default:
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          COUNT(*) as value
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true
        GROUP BY bucket_start_time
        ORDER BY timestamp ASC
      `
  }
}

export async function getQueryInsightsMetrics(
  { projectRef, connectionString, metric, startTime, endTime }: QueryInsightsMetricsVariables,
  signal?: AbortSignal
) {
  const sql = getQueryInsightsMetricsSQL(metric, startTime, endTime)

  console.log('getQueryInsightsMetrics Debug:', {
    projectRef,
    hasConnectionString: !!connectionString,
    metric,
    startTime,
    endTime,
    sql
  })

  const { result } = await executeSql(
    { 
      projectRef, 
      connectionString, 
      sql, 
      queryKey: queryInsightsKeys.metrics(projectRef, metric, startTime, endTime) 
    },
    signal
  )

  console.log('getQueryInsightsMetrics Result:', {
    result,
    resultLength: result?.length,
    firstRow: result?.[0]
  })

  return result as QueryInsightsMetric[]
}

export type QueryInsightsMetricsData = Awaited<ReturnType<typeof getQueryInsightsMetrics>>
export type QueryInsightsMetricsError = ExecuteSqlError

export const useQueryInsightsMetricsQuery = <TData = QueryInsightsMetricsData>(
  { projectRef, connectionString, metric, startTime, endTime }: QueryInsightsMetricsVariables,
  { enabled = true, ...options }: UseQueryOptions<QueryInsightsMetricsData, QueryInsightsMetricsError, TData> = {}
) => {
  return useQuery<QueryInsightsMetricsData, QueryInsightsMetricsError, TData>(
    queryInsightsKeys.metrics(projectRef, metric, startTime, endTime),
    ({ signal }) => getQueryInsightsMetrics({ projectRef, connectionString, metric, startTime, endTime }, signal),
    { 
      enabled: enabled && typeof projectRef !== 'undefined', 
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      ...options 
    }
  )
}