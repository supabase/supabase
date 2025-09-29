import { useQuery, UseQueryOptions, useQueryClient } from '@tanstack/react-query'
import { executeSql } from '../sql/execute-sql-query'
import { queryInsightsKeys } from './keys'
import { useEffect } from 'react'

export type InsightsMetric = {
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
  p75?: number
  p95?: number
  p99?: number
  p99_9?: number
}

const getAllMetricsSql = (startTime: string, endTime: string) => {
  return /* SQL */ `
    SELECT
      COALESCE(SUM(CASE WHEN cmd_type = 1 THEN rows ELSE 0 END), 0) as total_rows_read,
      COALESCE(SUM(calls), 0) as total_calls,
      COALESCE(SUM(shared_blks_hit), 0) as total_cache_hits,
      COALESCE(SUM(shared_blks_read), 0) as total_cache_misses,
      COALESCE(SUM(shared_blks_hit + shared_blks_read), 0) as total_hits
    FROM pg_stat_monitor
    WHERE bucket_start_time >= '${startTime}'::timestamptz
      AND bucket_start_time <= '${endTime}'::timestamptz
      AND bucket_done = true
  `
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

    case 'query_latency':
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          percentile_cont(0.50) WITHIN GROUP (ORDER BY mean_exec_time) as p50,
          percentile_cont(0.75) WITHIN GROUP (ORDER BY mean_exec_time) as p75,
          percentile_cont(0.95) WITHIN GROUP (ORDER BY mean_exec_time) as p95,
          percentile_cont(0.99) WITHIN GROUP (ORDER BY mean_exec_time) as p99,
          percentile_cont(0.999) WITHIN GROUP (ORDER BY mean_exec_time) as p99_9,
          datname as database
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true
        GROUP BY bucket_start_time, datname
        ORDER BY timestamp ASC
      `

    case 'calls':
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          SUM(calls) as value,
          datname as database
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true
        GROUP BY bucket_start_time, datname
        ORDER BY timestamp ASC
      `

    case 'cache_hits':
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          SUM(shared_blks_hit) as shared_blks_hit,
          SUM(shared_blks_read) as shared_blks_read,
          SUM(shared_blks_dirtied) as shared_blks_dirtied,
          SUM(shared_blks_written) as shared_blks_written,
          datname as database
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true
        GROUP BY bucket_start_time, datname
        ORDER BY timestamp ASC
      `

    default:
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          SUM(rows) / 300 as value,
          datname as database
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true
        GROUP BY bucket_start_time, datname
        ORDER BY timestamp ASC
      `
  }
}

export function useInsightsMetricsQuery(
  projectRef: string | undefined,
  metric: string,
  startTime: string,
  endTime: string,
  options?: UseQueryOptions<InsightsMetric[]>
) {
  return useQuery({
    queryKey: queryInsightsKeys.metrics(projectRef, metric, startTime, endTime),
    queryFn: async () => {
      if (!projectRef) throw new Error('Project ref is required')

      const sql = getMetricsSql(metric, startTime, endTime)

      const { result } = await executeSql({
        projectRef,
        sql,
      })

      return result as InsightsMetric[]
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  })
}

export function useAllMetricsQuery(
  projectRef: string | undefined,
  startTime: string,
  endTime: string,
  options?: UseQueryOptions<{
    total_rows_read: number
    total_calls: number
    total_cache_hits: number
    total_cache_misses: number
    total_hits: number
  }>
) {
  return useQuery({
    queryKey: queryInsightsKeys.metrics(projectRef, 'all_metrics', startTime, endTime),
    queryFn: async () => {
      if (!projectRef) throw new Error('Project ref is required')

      const sql = getAllMetricsSql(startTime, endTime)

      const { result } = await executeSql({
        projectRef,
        sql,
      })

      return result[0] as {
        total_rows_read: number
        total_calls: number
        total_cache_hits: number
        total_cache_misses: number
        total_hits: number
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  })
}

export function useInsightsPrefetchQuery(
  projectRef: string | undefined,
  startTime: string,
  endTime: string
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!projectRef) return
    // Pre-fetch all metric types
    const metricTypes: Array<{ id: string; label: string }> = [
      { id: 'query_latency', label: 'Query latency' },
      { id: 'rows_read', label: 'Rows read' },
      { id: 'calls', label: 'Calls' },
      { id: 'cache_hits', label: 'Cache hits' },
    ]

    metricTypes.forEach((metric) => {
      queryClient.prefetchQuery({
        queryKey: queryInsightsKeys.metrics(projectRef, metric.id, startTime, endTime),
        queryFn: async () => {
          const sql = getMetricsSql(metric.id, startTime, endTime)

          const { result } = await executeSql({
            projectRef,
            sql,
          })

          return result as InsightsMetric[]
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      })
    })
  }, [projectRef, startTime, endTime, queryClient])
}
