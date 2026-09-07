import { useQuery } from '@tanstack/react-query'

import { executeAnalyticsSql } from './execute-analytics-sql'
import { logsKeys } from './keys'
import { parseOtelTimestamp } from './otel-inspection.utils'
import { analyticsLiteral as lit, safeSql } from './safe-analytics-sql'
import { UNIFIED_LOGS_QUERY_OPTIONS } from './unified-logs-infinite-query'
import { LEVEL_EXPR, LOG_TYPE_EXPR } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import { handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export interface TracedLogBundleEntry {
  id: string
  timestamp: string
  event_message: string
  level: string
  log_type: string
}

export type TracedLogBundleVariables = {
  projectRef?: string
  requestId?: string
  /** The bundle row's own timestamp (ms since epoch) — bounds the query to a tight window
   * around it instead of scanning the whole logs table for a global request_id lookup. */
  bundleTimestampMs?: number | null
}

const BUNDLE_LOG_LIMIT = 100
// A traced request's hops normally complete within seconds; this window is generous
// enough to absorb clock/propagation skew between services without scanning broadly.
const BUNDLE_WINDOW_MS = 5 * 60 * 1000

export async function getTracedLogBundle(
  { projectRef, requestId, bundleTimestampMs }: TracedLogBundleVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required for getTracedLogBundle')
  if (!requestId) throw new Error('requestId is required for getTracedLogBundle')

  const anchorMs =
    typeof bundleTimestampMs === 'number' && Number.isFinite(bundleTimestampMs)
      ? bundleTimestampMs
      : Date.now()

  const sql = safeSql`-- traced logs: individual log lines for one request_id bundle
SELECT
  id,
  timestamp,
  event_message,
  (${LEVEL_EXPR}) AS level,
  (${LOG_TYPE_EXPR}) AS log_type
FROM logs
WHERE log_attributes['request_id'] = ${lit(requestId)}
  AND source IN ('edge_logs', 'auth_logs', 'storage_logs')
ORDER BY timestamp ASC
LIMIT ${lit(BUNDLE_LOG_LIMIT)}
`

  const data = await executeAnalyticsSql({
    projectRef,
    endpoint: '/platform/projects/{ref}/analytics/endpoints/logs.all.otel',
    sql,
    iso_timestamp_start: new Date(anchorMs - BUNDLE_WINDOW_MS).toISOString(),
    iso_timestamp_end: new Date(anchorMs + BUNDLE_WINDOW_MS).toISOString(),
    signal,
  })

  if (data.error) handleError(new Error(data.error as string))

  const result: any[] = data?.result ?? []

  return result.map(
    (row): TracedLogBundleEntry => ({
      id: row.id,
      timestamp: String(parseOtelTimestamp(row.timestamp).getTime() * 1000),
      event_message: row.event_message || '',
      level: row.level || '',
      log_type: row.log_type || '',
    })
  )
}

export type TracedLogBundleData = Awaited<ReturnType<typeof getTracedLogBundle>>
export type TracedLogBundleError = ResponseError

export const useTracedLogBundleQuery = <TData = TracedLogBundleData>(
  { projectRef, requestId, bundleTimestampMs }: TracedLogBundleVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<TracedLogBundleData, TracedLogBundleError, TData> = {}
) => {
  return useQuery<TracedLogBundleData, TracedLogBundleError, TData>({
    queryKey: logsKeys.tracedLogBundle(projectRef, requestId),
    queryFn: ({ signal }) =>
      getTracedLogBundle({ projectRef, requestId, bundleTimestampMs }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof requestId !== 'undefined',
    ...UNIFIED_LOGS_QUERY_OPTIONS,
    ...options,
  })
}
