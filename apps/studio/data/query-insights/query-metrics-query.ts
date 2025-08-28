import { useQuery, UseQueryOptions, useQueryClient } from '@tanstack/react-query'
import { executeSql } from '../sql/execute-sql-query'
import { queryInsightsKeys } from './keys'
import { useEffect, useCallback } from 'react'

export type QueryInsightsMetric = {
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
  slowness_rating: string
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
    case 'calls':
      return /* SQL */ `
        SELECT
          bucket_start_time as timestamp,
          SUM(calls) as value,
          datname as database
        FROM pg_stat_monitor
        WHERE bucket_start_time >= '${startTime}'::timestamptz
          AND bucket_start_time <= '${endTime}'::timestamptz
          AND bucket_done = true -- Only include completed buckets
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
          AND bucket_done = true -- Only include completed buckets
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
  WITH base_queries AS (
    SELECT 
      queryid AS query_id,
      -- Prefer top-level query if available, else fallback to normalized form
      COALESCE(MAX(top_query), MAX(query)) AS query,
      -- Total time spent executing this query across all calls
      SUM(total_exec_time) AS total_time,
      -- Number of times this query was executed
      SUM(calls) AS calls,
      -- Total rows affected or returned depending on command type
      SUM(CASE WHEN cmd_type = 1 THEN rows ELSE 0 END) AS rows_read,   -- SELECT
      SUM(CASE WHEN cmd_type = 2 THEN rows ELSE 0 END) AS rows_insert, -- INSERT
      SUM(CASE WHEN cmd_type = 3 THEN rows ELSE 0 END) AS rows_update, -- UPDATE
      SUM(CASE WHEN cmd_type = 4 THEN rows ELSE 0 END) AS rows_delete, -- DELETE
      -- Buffer activity: disk reads vs cache hits
      SUM(shared_blks_read) AS shared_blks_read,
      SUM(shared_blks_hit) AS shared_blks_hit,
      -- Mean execution time per call
      SUM(total_exec_time) / NULLIF(SUM(calls), 0) AS mean_exec_time,
      -- Metadata
      STRING_AGG(DISTINCT datname, ', ') AS database,
      MAX(bucket_start_time) AS timestamp,
      MAX(get_cmd_type(cmd_type)) AS cmd_type_text,
      STRING_AGG(DISTINCT COALESCE(application_name, 'Unknown'), ', ') AS application_name,
      -- Total number of rows affected or returned across all executions
      (
        SUM(CASE WHEN cmd_type = 1 THEN rows ELSE 0 END) + 
        SUM(CASE WHEN cmd_type = 2 THEN rows ELSE 0 END) + 
        SUM(CASE WHEN cmd_type = 3 THEN rows ELSE 0 END) + 
        SUM(CASE WHEN cmd_type = 4 THEN rows ELSE 0 END)
      ) AS rows_total,
      -- Error information (using available columns)
      COUNT(CASE WHEN mean_exec_time > 1000 AND calls > 1 THEN 1 END) AS error_count,
      -- Heuristic "badness score":
      -- Penalizes queries that are slow, frequent, and touch few rows
      (
        (SUM(total_exec_time) / NULLIF(SUM(calls), 1)) *  -- mean execution time
        LOG(GREATEST(SUM(calls), 1)) /                    -- scaled by frequency
        GREATEST(                                         -- penalize low-row queries
          SUM(CASE WHEN cmd_type = 1 THEN rows ELSE 0 END) + 
          SUM(CASE WHEN cmd_type = 2 THEN rows ELSE 0 END) + 
          SUM(CASE WHEN cmd_type = 3 THEN rows ELSE 0 END) + 
          SUM(CASE WHEN cmd_type = 4 THEN rows ELSE 0 END),
        1)
      ) AS badness_score,
      -- Slowness rating based on mean execution time
      CASE 
        WHEN SUM(total_exec_time) / NULLIF(SUM(calls), 0) < 100 THEN 'GREAT'
        WHEN SUM(total_exec_time) / NULLIF(SUM(calls), 0) < 200 THEN 'ACCEPTABLE'
        WHEN SUM(total_exec_time) / NULLIF(SUM(calls), 0) < 1000 THEN 'NOTICEABLE'
        WHEN SUM(total_exec_time) / NULLIF(SUM(calls), 0) < 5000 THEN 'SLOW'
        ELSE 'CRITICAL'
      END AS slowness_rating
    FROM pg_stat_monitor
    WHERE bucket_start_time >= '${startTime}'
      AND bucket_start_time <= '${endTime}'
      AND bucket_done = true
      -- AND cmd_type IN (1, 2, 3, 4)  -- Only consider SELECT, INSERT, UPDATE, DELETE
    GROUP BY queryid
  )
  SELECT 
    q.*,
    ia.*
  FROM 
    base_queries q
    LEFT JOIN LATERAL (
      SELECT * 
      FROM index_advisor(q.query)
    ) ia ON q.query ILIKE 'SELECT%' OR q.query ILIKE 'WITH%'
  ORDER BY badness_score DESC
  LIMIT 9999;
`

const getQueriesWithErrorsSql = (startTime: string, endTime: string) => /* SQL */ `
  WITH base_queries AS (
    SELECT 
      queryid AS query_id,
      -- Prefer top-level query if available, else fallback to normalized form
      COALESCE(MAX(top_query), MAX(query)) AS query,
      -- Total time spent executing this query across all calls
      SUM(total_exec_time) AS total_time,
      -- Number of times this query was executed
      SUM(calls) AS calls,
      -- Total rows affected or returned depending on command type
      SUM(CASE WHEN cmd_type = 1 THEN rows ELSE 0 END) AS rows_read,   -- SELECT
      SUM(CASE WHEN cmd_type = 2 THEN rows ELSE 0 END) AS rows_insert, -- INSERT
      SUM(CASE WHEN cmd_type = 3 THEN rows ELSE 0 END) AS rows_update, -- UPDATE
      SUM(CASE WHEN cmd_type = 4 THEN rows ELSE 0 END) AS rows_delete, -- DELETE
      -- Buffer activity: disk reads vs cache hits
      SUM(shared_blks_read) AS shared_blks_read,
      SUM(shared_blks_hit) AS shared_blks_hit,
      -- Mean execution time per call
      SUM(total_exec_time) / NULLIF(SUM(calls), 0) AS mean_exec_time,
      -- Metadata
      STRING_AGG(DISTINCT datname, ', ') AS database,
      MAX(bucket_start_time) AS timestamp,
      MAX(get_cmd_type(cmd_type)) AS cmd_type_text,
      STRING_AGG(DISTINCT COALESCE(application_name, 'Unknown'), ', ') AS application_name,
      -- Total number of rows affected or returned across all executions
      (
        SUM(CASE WHEN cmd_type = 1 THEN rows ELSE 0 END) + 
        SUM(CASE WHEN cmd_type = 2 THEN rows ELSE 0 END) + 
        SUM(CASE WHEN cmd_type = 3 THEN rows ELSE 0 END) + 
        SUM(CASE WHEN cmd_type = 4 THEN rows ELSE 0 END)
      ) AS rows_total,
      -- Error information (using available columns)
      COUNT(CASE WHEN mean_exec_time > 1000 AND calls > 1 THEN 1 END) AS error_count,
      -- Heuristic "badness score":
      -- Penalizes queries that are slow, frequent, and touch few rows
      (
        (SUM(total_exec_time) / NULLIF(SUM(calls), 1)) *  -- mean execution time
        LOG(GREATEST(SUM(calls), 1)) /                    -- scaled by frequency
        GREATEST(                                         -- penalize low-row queries
          SUM(CASE WHEN cmd_type = 1 THEN rows ELSE 0 END) + 
          SUM(CASE WHEN cmd_type = 2 THEN rows ELSE 0 END) + 
          SUM(CASE WHEN cmd_type = 3 THEN rows ELSE 0 END) + 
          SUM(CASE WHEN cmd_type = 4 THEN rows ELSE 0 END),
        1)
      ) AS badness_score,
      -- Slowness rating based on mean execution time
      CASE 
        WHEN SUM(total_exec_time) / NULLIF(SUM(calls), 0) < 100 THEN 'GREAT'
        WHEN SUM(total_exec_time) / NULLIF(SUM(calls), 0) < 200 THEN 'ACCEPTABLE'
        WHEN SUM(total_exec_time) / NULLIF(SUM(calls), 0) < 1000 THEN 'NOTICEABLE'
        WHEN SUM(total_exec_time) / NULLIF(SUM(calls), 0) < 5000 THEN 'SLOW'
        ELSE 'CRITICAL'
      END AS slowness_rating
    FROM pg_stat_monitor
    WHERE bucket_start_time >= '${startTime}'
      AND bucket_start_time <= '${endTime}'
      AND bucket_done = true
      AND mean_exec_time > 1000 
      AND calls > 1  -- Only include queries that are slow and called multiple times
    GROUP BY queryid
  )
  SELECT 
    q.*,
    ia.*
  FROM 
    base_queries q
    LEFT JOIN LATERAL (
      SELECT * 
      FROM index_advisor(q.query)
    ) ia ON q.query ILIKE 'SELECT%' OR q.query ILIKE 'WITH%'
  ORDER BY error_count DESC, badness_score DESC
  LIMIT 9999;
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

      const sql = getMetricsSql(metric, startTime, endTime)
      console.log(`[useQueryInsightsMetrics] Executing SQL for ${metric}:`, sql)

      const { result } = await executeSql({
        projectRef,
        sql,
      })

      console.log(`[useQueryInsightsMetrics] Result for ${metric}:`, result)

      return result as QueryInsightsMetric[]
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  })
}

export function useQueryInsightsQueriesWithErrors(
  projectRef: string | undefined,
  startTime: string,
  endTime: string,
  options?: UseQueryOptions<QueryInsightsQuery[]>
) {
  return useQuery({
    queryKey: queryInsightsKeys.queriesWithErrors(projectRef, startTime, endTime),
    queryFn: async () => {
      if (!projectRef) throw new Error('Project ref is required')

      const { result } = await executeSql({
        projectRef,
        sql: getQueriesWithErrorsSql(startTime, endTime),
      })

      return result as QueryInsightsQuery[]
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  })
}

// Hook to pre-fetch all metrics data for the current time range
export function usePreFetchQueryInsightsData(
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
          console.log(`[usePreFetchQueryInsightsData] Executing SQL for ${metric.id}:`, sql)

          const { result } = await executeSql({
            projectRef,
            sql,
          })

          console.log(`[usePreFetchQueryInsightsData] Result for ${metric.id}:`, result)
          return result as QueryInsightsMetric[]
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      })
    })

    // Pre-fetch queries data
    queryClient.prefetchQuery({
      queryKey: queryInsightsKeys.queries(projectRef, startTime, endTime),
      queryFn: async () => {
        const { result } = await executeSql({
          projectRef,
          sql: getQueriesSql(startTime, endTime),
        })
        return result as QueryInsightsQuery[]
      },
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    })

    // Pre-fetch queries with errors data
    queryClient.prefetchQuery({
      queryKey: queryInsightsKeys.queriesWithErrors(projectRef, startTime, endTime),
      queryFn: async () => {
        const { result } = await executeSql({
          projectRef,
          sql: getQueriesWithErrorsSql(startTime, endTime),
        })
        return result as QueryInsightsQuery[]
      },
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    })
  }, [projectRef, startTime, endTime, queryClient])
}

// Hook for better cache management and manual refresh control
export function useQueryInsightsCacheManager(
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
      queryClient.invalidateQueries({
        queryKey: queryInsightsKeys.queries(projectRef, startTime, endTime),
      }),
      queryClient.invalidateQueries({
        queryKey: queryInsightsKeys.queriesWithErrors(projectRef, startTime, endTime),
      }),
    ])
  }, [projectRef, startTime, endTime, queryClient])

  const isAnyDataStale = useCallback(() => {
    if (!projectRef) return false

    const metricTypes = ['query_latency', 'rows_read', 'calls', 'cache_hits', 'issues']

    return (
      metricTypes.some((metric) => {
        const query = queryClient.getQueryData(
          queryInsightsKeys.metrics(projectRef, metric, startTime, endTime)
        )
        return !query
      }) ||
      !queryClient.getQueryData(queryInsightsKeys.queries(projectRef, startTime, endTime)) ||
      !queryClient.getQueryData(queryInsightsKeys.queriesWithErrors(projectRef, startTime, endTime))
    )
  }, [projectRef, startTime, endTime, queryClient])

  return {
    refreshAllData,
    isAnyDataStale,
  }
}
