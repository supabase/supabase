import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { queryInsightsKeys } from './keys'

export type InsightsGlance = {
  unique_queries: number
  total_queries: number
  avg_query_time: number
  max_query_time: number
  error_count: number
  avg_error_rate: number
}

export const getInsightsGlanceMetrics = (startTime: string, endTime: string) =>
  /* SQL */ `
  SELECT 
    COUNT(DISTINCT query) as unique_queries,
    SUM(calls) as total_queries,
    AVG(mean_exec_time) as avg_query_time,
    MAX(mean_exec_time) as max_query_time,
    COUNT(CASE WHEN mean_exec_time > 1000 AND calls > 1 THEN 1 END) as error_count,
    CASE 
      WHEN SUM(calls) > 0 THEN 
        (COUNT(CASE WHEN mean_exec_time > 1000 AND calls > 1 THEN 1 END)::float / SUM(calls)::float) * 100
      ELSE 0 
    END as avg_error_rate
  FROM pg_stat_monitor 
  WHERE bucket_start_time >= '${startTime}'::timestamptz
    AND bucket_start_time <= '${endTime}'::timestamptz
    AND bucket_done = true
`.trim()

export type InsightsGlanceVariables = {
  projectRef?: string
  connectionString?: string | null
  startTime: string
  endTime: string
}

export async function getInsightsGlance(
  { projectRef, connectionString, startTime, endTime }: InsightsGlanceVariables,
  signal?: AbortSignal
) {
  const sql = getInsightsGlanceMetrics(startTime, endTime)

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: queryInsightsKeys.glance(projectRef, startTime, endTime),
    },
    signal
  )

  return result[0] as InsightsGlance
}

export type InsightsGlanceData = Awaited<ReturnType<typeof getInsightsGlance>>
export type InsightsGlanceError = ExecuteSqlError

export function useInsightsGlanceQuery(
  projectRef: string | undefined,
  startTime: string,
  endTime: string,
  options?: UseQueryOptions<InsightsGlanceData>
) {
  return useQuery({
    queryKey: queryInsightsKeys.glance(projectRef, startTime, endTime),
    queryFn: async () => {
      if (!projectRef) throw new Error('Project ref is required')

      const sql = getInsightsGlanceMetrics(startTime, endTime)

      const { result } = await executeSql({
        projectRef,
        sql,
      })

      return result[0] as InsightsGlance
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  })
}
