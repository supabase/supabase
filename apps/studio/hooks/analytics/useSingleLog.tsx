import { useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'
import { useMemo } from 'react'

import { LOGS_TABLES } from '@/components/interfaces/Settings/Logs/Logs.constants'
import type {
  LogData,
  Logs,
  LogsEndpointParams,
  QueryType,
} from '@/components/interfaces/Settings/Logs/Logs.types'
import { genSingleLogQuery } from '@/components/interfaces/Settings/Logs/Logs.utils'
import {
  genSingleLogQueryOtel,
  mapOtelSingleLogToLegacy,
} from '@/components/interfaces/Settings/Logs/Logs.utils.otel'
import { executeAnalyticsSql } from '@/data/logs/execute-analytics-sql'
import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'
import { safeSql } from '@/data/logs/safe-analytics-sql'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

interface SingleLogHook {
  data: LogData | undefined
  error: string | Object | null
  isLoading: boolean
  refresh: () => void
}

type SingleLogParams = {
  id?: string
  projectRef: string
  queryType?: QueryType
  paramsToMerge?: Partial<LogsEndpointParams>
}
function useSingleLog({
  projectRef,
  id,
  queryType,
  paramsToMerge,
}: SingleLogParams): SingleLogHook {
  const table = queryType ? LOGS_TABLES[queryType] : undefined

  // When on, fetch the log from the OTEL endpoint instead of BigQuery.
  const useOtel = useFlag('otelLegacyLogs')
  const endpoint = logsAllEndpointUrl(useOtel)

  const sql = useMemo(() => {
    if (!id || !table) return safeSql``
    if (useOtel) {
      try {
        return genSingleLogQueryOtel(id)
      } catch {
        // Malformed (non-uuid) id — emit nothing rather than throwing in render.
        return safeSql``
      }
    }
    return genSingleLogQuery(table, id)
  }, [id, table, useOtel])

  const enabled = Boolean(id && table)

  const { logsMetadata } = useIsFeatureEnabled(['logs:metadata'])

  const {
    data,
    error: rcError,
    isPending,
    isRefetching,
    refetch,
  } = useQuery({
    // id and queryType uniquely identify sql without having to stick the
    // entire sql in the query key.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      'projects',
      projectRef,
      'single-log',
      id,
      queryType,
      paramsToMerge?.iso_timestamp_start,
      paramsToMerge?.iso_timestamp_end,
      { otel: useOtel },
    ],
    queryFn: async ({ signal }) => {
      const data = await executeAnalyticsSql({
        projectRef,
        endpoint,
        sql,
        iso_timestamp_start: paramsToMerge?.iso_timestamp_start ?? '',
        iso_timestamp_end: paramsToMerge?.iso_timestamp_end ?? '',
        method: 'get',
        signal,
      })
      return data as unknown as Logs
    },
    enabled,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  let error: null | string | object = rcError ? (rcError as any).message : null
  const rawResult = data?.result ? data.result[0] : undefined
  const result = rawResult && useOtel ? mapOtelSingleLogToLegacy(rawResult, queryType) : rawResult

  return {
    data: !!result
      ? { ...result, metadata: logsMetadata ? result?.metadata : undefined }
      : undefined,
    isLoading: (enabled && isPending) || isRefetching,
    error,
    refresh: () => refetch(),
  }
}
export default useSingleLog
