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
  /**
   * The selected row's own timestamp (microseconds), when known. A single log is
   * always looked up by `id`, which is not part of the logs table's sort key, so
   * the query is bounded tightly around this timestamp instead of the
   * (potentially much wider) selected search range. Falls back to the search
   * range when unavailable — e.g. a deep-linked log that isn't in a loaded page.
   */
  logTimestampMicros?: number | null
}

// The row's timestamp is the exact stored value carried over from the row we
// already fetched, not an approximate clock reading, so this only needs to
// absorb rounding — not real clock skew. Mirrors `INSPECTION_WINDOW_MS` in
// `data/logs/unified-log-inspection-query.ts`.
const SINGLE_LOG_WINDOW_MS = 60 * 1000

/**
 * Resolves the time bounds for a single-log lookup: a tight window around the
 * row's own timestamp when it's known, otherwise the selected search range.
 */
export const resolveSingleLogWindow = (
  logTimestampMicros: number | null | undefined,
  paramsToMerge?: Partial<LogsEndpointParams>
): { isoTimestampStart: string; isoTimestampEnd: string } => {
  if (typeof logTimestampMicros !== 'number' || !Number.isFinite(logTimestampMicros)) {
    return {
      isoTimestampStart: paramsToMerge?.iso_timestamp_start ?? '',
      isoTimestampEnd: paramsToMerge?.iso_timestamp_end ?? '',
    }
  }

  const timestampMs = logTimestampMicros / 1000
  return {
    isoTimestampStart: new Date(timestampMs - SINGLE_LOG_WINDOW_MS).toISOString(),
    isoTimestampEnd: new Date(timestampMs + SINGLE_LOG_WINDOW_MS).toISOString(),
  }
}

function useSingleLog({
  projectRef,
  id,
  queryType,
  paramsToMerge,
  logTimestampMicros,
}: SingleLogParams): SingleLogHook {
  const table = queryType ? LOGS_TABLES[queryType] : undefined

  // When on, fetch the log from the OTEL endpoint instead of BigQuery.
  const useOtel = useFlag('otelLegacyLogs')
  const endpoint = logsAllEndpointUrl(useOtel)

  const sql = useMemo(() => {
    if (!id || !table) return safeSql``
    if (useOtel) {
      try {
        return genSingleLogQueryOtel(table, id)
      } catch {
        // Malformed (non-uuid) id — emit nothing rather than throwing in render.
        return safeSql``
      }
    }
    return genSingleLogQuery(table, id)
  }, [id, table, useOtel])

  // Bound the lookup to a tight window around the row's own timestamp, falling
  // back to the selected search range when it isn't known.
  const { isoTimestampStart, isoTimestampEnd } = useMemo(
    () => resolveSingleLogWindow(logTimestampMicros, paramsToMerge),
    [logTimestampMicros, paramsToMerge?.iso_timestamp_start, paramsToMerge?.iso_timestamp_end]
  )

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
      isoTimestampStart,
      isoTimestampEnd,
      { otel: useOtel },
    ],
    queryFn: async ({ signal }) => {
      const data = await executeAnalyticsSql({
        projectRef,
        endpoint,
        sql,
        iso_timestamp_start: isoTimestampStart,
        iso_timestamp_end: isoTimestampEnd,
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
