import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from '../sql/execute-sql-query'
import { queryInsightsKeys } from './keys'

export type QueryInsightsMetric = {
  timestamp: string
  value?: number
  rows?: number
  cmd_type_text?: string
  database: string
  shared_blks_read?: number
  shared_blks_hit?: number
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
}

export type QueryInsightsMetrics = {
  queries: {
    total: number
    total_time: number
    avg_time: number
    total_rows: number
  }
  cache: {
    hit_ratio: number
    hits: number
    misses: number
  }
  errors: {
    total: number
  }
}

const getMetricsSql = (metric: string, startTime: string, endTime: string) => {
  switch (metric) {
    case 'rows_read':
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          SUM(rows) as value,
          datname as database
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true
          AND cmd_type = 1
        GROUP BY bucket_start_time, datname
        ORDER BY timestamp ASC
      `
    // case 'rows_written':
    //   return /* SQL */ `
    //     SELECT
    //       bucket_start_time as timestamp,
    //       SUM(rows) / 300 as value, -- Convert to per-second rate (5 mins = 300 seconds)
    //       datname as database
    //     FROM pg_stat_monitor
    //     WHERE bucket_start_time >= '${startTime}'::timestamptz
    //       AND bucket_start_time <= '${endTime}'::timestamptz
    //       AND bucket_done = true -- Only include completed buckets
    //     GROUP BY bucket_start_time, datname
    //     ORDER BY timestamp ASC
    //   `
    case 'query_latency':
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          percentile_cont(0.50) WITHIN GROUP (ORDER BY mean_exec_time) as p50,
          percentile_cont(0.95) WITHIN GROUP (ORDER BY mean_exec_time) as p95,
          percentile_cont(0.99) WITHIN GROUP (ORDER BY mean_exec_time) as p99,
          percentile_cont(0.999) WITHIN GROUP (ORDER BY mean_exec_time) as p99_9,
          datname as database
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true -- Only include completed buckets
        GROUP BY bucket_start_time, datname
        ORDER BY timestamp ASC
      `
    case 'queries_per_second':
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          COUNT(*) / 300.0 as value, -- Convert to per-second rate (5 mins = 300 seconds)
          datname as database
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true -- Only include completed buckets
        GROUP BY bucket_start_time, datname
        ORDER BY timestamp ASC
      `
    default:
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          SUM(rows) / 300 as value, -- Convert to per-second rate (5 mins = 300 seconds)
          datname as database
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true -- Only include completed buckets
        GROUP BY bucket_start_time, datname
        ORDER BY timestamp ASC
      `
  }
}

const getQueriesSql = (startTime: string, endTime: string) => /* SQL */ `
  SELECT 
    queryid as query_id,
    COALESCE(MAX(top_query), MAX(query)) as query,
    SUM(total_exec_time) as total_time,
    SUM(calls) as calls,
    SUM(CASE WHEN cmd_type = 1 THEN rows ELSE 0 END) as rows_read,
    SUM(CASE WHEN cmd_type = 2 THEN rows ELSE 0 END) as rows_insert,
    SUM(CASE WHEN cmd_type = 3 THEN rows ELSE 0 END) as rows_update,
    SUM(CASE WHEN cmd_type = 4 THEN rows ELSE 0 END) as rows_delete,
    SUM(shared_blks_read) as shared_blks_read,
    SUM(shared_blks_hit) as shared_blks_hit,
    SUM(total_exec_time) / NULLIF(SUM(calls), 0) as mean_exec_time,
    STRING_AGG(DISTINCT datname, ', ') as database,
    MAX(bucket_start_time) as timestamp,
    MAX(get_cmd_type(cmd_type)) as cmd_type_text
  FROM pg_stat_monitor
  WHERE bucket_start_time >= '${startTime}'
    AND bucket_start_time <= '${endTime}'
    AND bucket_done = true
  GROUP BY queryid
  ORDER BY mean_exec_time DESC
  LIMIT 100
`

export function useQueryInsightsMetrics(
  projectRef: string | undefined,
  metric: string,
  startTime: string,
  endTime: string,
  options?: UseQueryOptions<QueryInsightsMetric[]>
) {
  return useQuery({
    queryKey: queryInsightsKeys.metrics(projectRef, metric, startTime, endTime),
    queryFn: async () => {
      if (!projectRef) throw new Error('Project ref is required')

      const { result } = await executeSql({
        projectRef,
        sql: getMetricsSql(metric, startTime, endTime),
      })

      return result as QueryInsightsMetric[]
    },
    ...options,
  })
}

export function useQueryInsightsQueries(
  projectRef: string | undefined,
  startTime: string,
  endTime: string,
  options?: UseQueryOptions<QueryInsightsQuery[]>
) {
  return useQuery({
    queryKey: queryInsightsKeys.queries(projectRef, startTime, endTime),
    queryFn: async () => {
      if (!projectRef) throw new Error('Project ref is required')

      const { result } = await executeSql({
        projectRef,
        sql: getQueriesSql(startTime, endTime),
      })

      return result as QueryInsightsQuery[]
    },
    ...options,
  })
}
