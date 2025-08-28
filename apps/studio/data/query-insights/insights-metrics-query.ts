import { useQuery, UseQueryOptions, useQueryClient } from '@tanstack/react-query'
import { executeSql } from '../sql/execute-sql-query'
import { queryInsightsKeys } from './keys'
import { useEffect, useCallback } from 'react'

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

export type InsightsMetrics = {
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

    case 'issues':
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          COUNT(CASE WHEN mean_exec_time > 1000 AND calls > 1 THEN 1 END) as value,
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
      console.log(`[useInsightsMetricsQuery] Executing SQL for ${metric}:`, sql)

      const { result } = await executeSql({
        projectRef,
        sql,
      })

      console.log(`[useInsightsMetricsQuery] Result for ${metric}:`, result)

      return result as InsightsMetric[]
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  })
}

// Hook to pre-fetch all metrics data for the current time range
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
      { id: 'issues', label: 'Issues' },
    ]

    // Pre-fetch metrics data
    metricTypes.forEach((metric) => {
      queryClient.prefetchQuery({
        queryKey: queryInsightsKeys.metrics(projectRef, metric.id, startTime, endTime),
        queryFn: async () => {
          const sql = getMetricsSql(metric.id, startTime, endTime)
          console.log(`[useInsightsPrefetchQuery] Executing SQL for ${metric.id}:`, sql)

          const { result } = await executeSql({
            projectRef,
            sql,
          })

          console.log(`[useInsightsPrefetchQuery] Result for ${metric.id}:`, result)
          return result as InsightsMetric[]
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      })
    })
  }, [projectRef, startTime, endTime, queryClient])
}

// Hook for better cache management and manual refresh control
export function useInsightsCacheManager(
  projectRef: string | undefined,
  startTime: string,
  endTime: string
) {
  const queryClient = useQueryClient()

  const refreshAllData = useCallback(async () => {
    if (!projectRef) return

    const metricTypes = ['query_latency', 'rows_read', 'calls', 'cache_hits', 'issues']

    // Invalidate and refetch all metrics
    await Promise.all([
      ...metricTypes.map((metric) =>
        queryClient.invalidateQueries({
          queryKey: queryInsightsKeys.metrics(projectRef, metric, startTime, endTime),
        })
      ),
    ])
  }, [projectRef, startTime, endTime, queryClient])

  const isAnyDataStale = useCallback(() => {
    if (!projectRef) return false

    const metricTypes = ['query_latency', 'rows_read', 'calls', 'cache_hits', 'issues']

    return metricTypes.some((metric) => {
      const query = queryClient.getQueryData(
        queryInsightsKeys.metrics(projectRef, metric, startTime, endTime)
      )
      return !query
    })
  }, [projectRef, startTime, endTime, queryClient])

  return {
    refreshAllData,
    isAnyDataStale,
  }
}
