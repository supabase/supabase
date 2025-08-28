import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from '../sql/execute-sql-query'
import { InsightsMetric } from './insights-metrics-query'

const singleQueryLatencyKeys = {
  base: ['projects', 'query-insights', 'single-query'] as const,
  latency: (
    projectRef: string | undefined,
    queryId: string | undefined,
    startTime: string,
    endTime: string
  ) =>
    [...singleQueryLatencyKeys.base, 'latency', projectRef, queryId, startTime, endTime] as const,
}

const singleQueryCallsKeys = {
  base: ['projects', 'query-insights', 'single-query-calls'] as const,
  calls: (
    projectRef: string | undefined,
    queryId: string | undefined,
    startTime: string,
    endTime: string
  ) => [...singleQueryCallsKeys.base, 'calls', projectRef, queryId, startTime, endTime] as const,
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
  WHERE bucket_start_time >= '${startTime}'::timestamptz
    AND bucket_start_time <= '${endTime}'::timestamptz
    AND bucket_done = true
    AND queryid = ${queryId}
  ORDER BY timestamp ASC
`

const getSingleQueryRowsSql = (queryId: string, startTime: string, endTime: string) => /* SQL */ `
  SELECT
    bucket_start_time as timestamp,
    rows as value,
    datname as database
  FROM pg_stat_monitor
  WHERE bucket_start_time >= '${startTime}'::timestamptz
    AND bucket_start_time <= '${endTime}'::timestamptz
    AND bucket_done = true
    AND queryid = ${queryId}
  ORDER BY timestamp ASC
`

const getSingleQueryRowsWrittenSql = (
  queryId: string,
  startTime: string,
  endTime: string
) => /* SQL */ `
  SELECT
    bucket_start_time as timestamp,
    rows as value,
    datname as database
  FROM pg_stat_monitor
  WHERE bucket_start_time >= '${startTime}'::timestamptz
    AND bucket_start_time <= '${endTime}'::timestamptz
    AND bucket_done = true
    AND queryid = ${queryId}
    AND cmd_type IN (2, 3, 4) -- INSERT, UPDATE, DELETE
  ORDER BY timestamp ASC
`

const getSingleQueryCallsSql = (queryId: string, startTime: string, endTime: string) => /* SQL */ `
  SELECT
    bucket_start_time as timestamp,
    calls as value,
    datname as database
  FROM pg_stat_monitor
  WHERE bucket_start_time >= '${startTime}'::timestamptz
    AND bucket_start_time <= '${endTime}'::timestamptz
    AND bucket_done = true
    AND queryid = ${queryId}
  ORDER BY timestamp ASC
`

export function useInsightsSingleQueryLatency(
  projectRef: string | undefined,
  startTime: string,
  endTime: string,
  queryId: string | undefined,
  options?: UseQueryOptions<InsightsMetric[]>
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

      console.log('Chart data points:', result)
      return result as InsightsMetric[]
    },
    enabled: !!queryId && !!projectRef,
    ...options,
  })
}

export function useInsightsSingleQueryRows(
  projectRef: string | undefined,
  startTime: string,
  endTime: string,
  queryId: string | undefined,
  options?: UseQueryOptions<InsightsMetric[]>
) {
  return useQuery({
    queryKey: [...singleQueryLatencyKeys.base, 'rows', projectRef, queryId, startTime, endTime],
    queryFn: async () => {
      if (!projectRef) throw new Error('Project ref is required')
      if (!queryId) return []

      const sql = getSingleQueryRowsSql(queryId, startTime, endTime)
      console.log('[useInsightsSingleQueryRows] Executing SQL:', sql)

      const { result } = await executeSql({
        projectRef,
        sql,
      })

      console.log('[useInsightsSingleQueryRows] Result:', result)
      return result as InsightsMetric[]
    },
    enabled: !!queryId && !!projectRef,
    ...options,
  })
}

export function useInsightsSingleQueryRowsWritten(
  projectRef: string | undefined,
  startTime: string,
  endTime: string,
  queryId: string | undefined,
  options?: UseQueryOptions<InsightsMetric[]>
) {
  return useQuery({
    queryKey: [
      ...singleQueryLatencyKeys.base,
      'rows-written',
      projectRef,
      queryId,
      startTime,
      endTime,
    ],
    queryFn: async () => {
      if (!projectRef) throw new Error('Project ref is required')
      if (!queryId) return []

      const sql = getSingleQueryRowsWrittenSql(queryId, startTime, endTime)
      console.log('[useInsightsSingleQueryRowsWritten] Executing SQL:', sql)

      const { result } = await executeSql({
        projectRef,
        sql,
      })

      console.log('[useInsightsSingleQueryRowsWritten] Result:', result)
      return result as InsightsMetric[]
    },
    enabled: !!queryId && !!projectRef,
    ...options,
  })
}

export function useInsightsSingleQueryCalls(
  projectRef: string | undefined,
  startTime: string,
  endTime: string,
  queryId: string | undefined,
  options?: UseQueryOptions<InsightsMetric[]>
) {
  return useQuery({
    queryKey: singleQueryCallsKeys.calls(projectRef, queryId, startTime, endTime),
    queryFn: async () => {
      if (!projectRef) throw new Error('Project ref is required')
      if (!queryId) return []

      const { result } = await executeSql({
        projectRef,
        sql: getSingleQueryCallsSql(queryId, startTime, endTime),
      })

      return result as InsightsMetric[]
    },
    enabled: !!queryId && !!projectRef,
    ...options,
  })
}
