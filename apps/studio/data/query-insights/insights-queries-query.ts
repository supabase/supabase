import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from '../sql/execute-sql-query'
import { queryInsightsKeys } from './keys'

export type InsightsQuery = {
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

const getQueriesSql = (startTime: string, endTime: string) => /* SQL */ `
  WITH base_queries AS (
    SELECT 
      queryid AS query_id,
      COALESCE(MAX(top_query), MAX(query)) AS query,
      SUM(total_exec_time) AS total_time,
      SUM(calls) AS calls,
      SUM(CASE WHEN cmd_type = 1 THEN rows ELSE 0 END) AS rows_read,
      SUM(CASE WHEN cmd_type = 2 THEN rows ELSE 0 END) AS rows_insert,
      SUM(CASE WHEN cmd_type = 3 THEN rows ELSE 0 END) AS rows_update,
      SUM(CASE WHEN cmd_type = 4 THEN rows ELSE 0 END) AS rows_delete,
      SUM(shared_blks_read) AS shared_blks_read,
      SUM(shared_blks_hit) AS shared_blks_hit,
      SUM(total_exec_time) / NULLIF(SUM(calls), 0) AS mean_exec_time,
      STRING_AGG(DISTINCT datname, ', ') AS database,
      MAX(bucket_start_time) AS timestamp,
      MAX(get_cmd_type(cmd_type)) AS cmd_type_text,
      STRING_AGG(DISTINCT COALESCE(application_name, 'Unknown'), ', ') AS application_name,
      (
        SUM(CASE WHEN cmd_type = 1 THEN rows ELSE 0 END) + 
        SUM(CASE WHEN cmd_type = 2 THEN rows ELSE 0 END) + 
        SUM(CASE WHEN cmd_type = 3 THEN rows ELSE 0 END) + 
        SUM(CASE WHEN cmd_type = 4 THEN rows ELSE 0 END)
      ) AS rows_total,
      COUNT(CASE WHEN mean_exec_time > 1000 AND calls > 1 THEN 1 END) AS error_count,
      (
        (SUM(total_exec_time) / NULLIF(SUM(calls), 1)) *
        LOG(GREATEST(SUM(calls), 1)) /
        GREATEST(
          SUM(CASE WHEN cmd_type = 1 THEN rows ELSE 0 END) + 
          SUM(CASE WHEN cmd_type = 2 THEN rows ELSE 0 END) + 
          SUM(CASE WHEN cmd_type = 3 THEN rows ELSE 0 END) + 
          SUM(CASE WHEN cmd_type = 4 THEN rows ELSE 0 END),
        1)
      ) AS badness_score,
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
  LIMIT 9999
`

const getQueriesWithErrorsSql = (startTime: string, endTime: string) => /* SQL */ `
  WITH base_queries AS (
    SELECT 
      queryid AS query_id,
      COALESCE(MAX(top_query), MAX(query)) AS query,
      SUM(total_exec_time) AS total_time,
      SUM(calls) AS calls,
      SUM(CASE WHEN cmd_type = 1 THEN rows ELSE 0 END) AS rows_read,
      SUM(CASE WHEN cmd_type = 2 THEN rows ELSE 0 END) AS rows_insert,
      SUM(CASE WHEN cmd_type = 3 THEN rows ELSE 0 END) AS rows_update,
      SUM(CASE WHEN cmd_type = 4 THEN rows ELSE 0 END) AS rows_delete,
      SUM(shared_blks_read) AS shared_blks_read,
      SUM(shared_blks_hit) AS shared_blks_hit,
      SUM(total_exec_time) / NULLIF(SUM(calls), 0) AS mean_exec_time,
      STRING_AGG(DISTINCT datname, ', ') AS database,
      MAX(bucket_start_time) AS timestamp,
      MAX(get_cmd_type(cmd_type)) AS cmd_type_text,
      STRING_AGG(DISTINCT COALESCE(application_name, 'Unknown'), ', ') AS application_name,
      (
        SUM(CASE WHEN cmd_type = 1 THEN rows ELSE 0 END) + 
        SUM(CASE WHEN cmd_type = 2 THEN rows ELSE 0 END) + 
        SUM(CASE WHEN cmd_type = 3 THEN rows ELSE 0 END) + 
        SUM(CASE WHEN cmd_type = 4 THEN rows ELSE 0 END)
      ) AS rows_total,
      COUNT(CASE WHEN mean_exec_time > 1000 AND calls > 1 THEN 1 END) AS error_count,
      (
        (SUM(total_exec_time) / NULLIF(SUM(calls), 1)) *
        LOG(GREATEST(SUM(calls), 1)) /
        GREATEST(
          SUM(CASE WHEN cmd_type = 1 THEN rows ELSE 0 END) + 
          SUM(CASE WHEN cmd_type = 2 THEN rows ELSE 0 END) + 
          SUM(CASE WHEN cmd_type = 3 THEN rows ELSE 0 END) + 
          SUM(CASE WHEN cmd_type = 4 THEN rows ELSE 0 END),
        1)
      ) AS badness_score,
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
      AND calls > 1
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
  LIMIT 9999
`

export function useInsightsQueriesQuery(
  projectRef: string | undefined,
  startTime: string,
  endTime: string,
  options?: UseQueryOptions<InsightsQuery[]>
) {
  return useQuery({
    queryKey: queryInsightsKeys.queries(projectRef, startTime, endTime),
    queryFn: async () => {
      if (!projectRef) throw new Error('Project ref is required')

      const { result } = await executeSql({
        projectRef,
        sql: getQueriesSql(startTime, endTime),
      })

      return result as InsightsQuery[]
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  })
}

export function useInsightsQueriesWithErrorsQuery(
  projectRef: string | undefined,
  startTime: string,
  endTime: string,
  options?: UseQueryOptions<InsightsQuery[]>
) {
  return useQuery({
    queryKey: queryInsightsKeys.queriesWithErrors(projectRef, startTime, endTime),
    queryFn: async () => {
      if (!projectRef) throw new Error('Project ref is required')

      const { result } = await executeSql({
        projectRef,
        sql: getQueriesWithErrorsSql(startTime, endTime),
      })

      return result as InsightsQuery[]
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  })
}
