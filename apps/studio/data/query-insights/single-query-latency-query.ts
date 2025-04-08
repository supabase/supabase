import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from '../sql/execute-sql-query'
import { QueryInsightsMetric } from './query-insights-query'

const singleQueryLatencyKeys = {
  base: ['single-query-latency'] as const,
  latency: (
    projectRef: string | undefined,
    queryId: string | undefined,
    startTime: string,
    endTime: string
  ) => [...singleQueryLatencyKeys.base, projectRef, queryId, startTime, endTime] as const,
}

const getSingleQueryLatencySql = (
  queryId: string,
  startTime: string,
  endTime: string
) => /* SQL */ `
  SELECT
    bucket_start_time as timestamp,
    mean_exec_time as value,
    datname as database
  FROM pg_stat_monitor
  WHERE queryid = '${queryId}'
    AND bucket_start_time >= '${startTime}'
    AND bucket_start_time <= '${endTime}'
  ORDER BY bucket_start_time ASC
`

export function useSingleQueryLatency(
  projectRef: string | undefined,
  queryId: string | undefined,
  startTime: string,
  endTime: string,
  options?: UseQueryOptions<QueryInsightsMetric[]>
) {
  return useQuery({
    queryKey: singleQueryLatencyKeys.latency(projectRef, queryId, startTime, endTime),
    queryFn: async () => {
      if (!projectRef) throw new Error('Project ref is required')
      if (!queryId) return []

      const { result } = await executeSql({
        projectRef,
        sql: getSingleQueryLatencySql(queryId, startTime, endTime),
      })

      return result as QueryInsightsMetric[]
    },
    enabled: !!queryId && !!projectRef,
    ...options,
  })
}
