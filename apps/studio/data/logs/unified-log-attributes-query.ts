import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { executeAnalyticsSql, type ExecuteAnalyticsSqlVariables } from './execute-analytics-sql'
import { logsKeys } from './keys'
import { UNIFIED_LOGS_QUERY_OPTIONS } from './unified-logs-infinite-query'
import { getLogAttributesQuery } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import { handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

// A log is looked up by its exact stored timestamp, so a tight window is enough.
const LOG_WINDOW_MS = 60 * 1000

const logAttributesRowSchema = z.object({
  source: z.string(),
  log_attributes: z.record(z.string(), z.unknown()).nullish(),
})

export type UnifiedLogAttributesVariables = {
  projectRef?: string
  logId?: string
  /** Source of the log, e.g. `edge_logs`. */
  source?: string
  logTimestampMs?: number | null
}

export type UnifiedLogAttributesError = ResponseError

const getLogTimeWindow = (timestampMs: number, windowMs: number) => ({
  iso_timestamp_start: new Date(timestampMs - windowMs).toISOString(),
  iso_timestamp_end: new Date(timestampMs + windowMs).toISOString(),
})

/** Runs SQL against the ClickHouse logs endpoint, which can answer 200 with an `error` body. */
async function runOtelLogsSql(variables: Omit<ExecuteAnalyticsSqlVariables, 'endpoint'>) {
  const data = await executeAnalyticsSql({
    ...variables,
    endpoint: '/platform/projects/{ref}/analytics/endpoints/logs.all.otel',
  })
  if (data?.error) handleError(data.error)
  return data?.result ?? []
}

/** One log's source and attributes, or undefined when it can't be found. */
async function getLogAttributesRow(
  { projectRef, logId, source, logTimestampMs }: UnifiedLogAttributesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!logId) throw new Error('logId is required')
  if (!source) throw new Error('source is required')
  if (typeof logTimestampMs !== 'number' || !Number.isFinite(logTimestampMs)) {
    throw new Error('logTimestampMs is required')
  }

  const result = await runOtelLogsSql({
    projectRef,
    sql: getLogAttributesQuery({ logId, source }),
    ...getLogTimeWindow(logTimestampMs, LOG_WINDOW_MS),
    signal,
  })
  return z.array(logAttributesRowSchema).parse(result)[0]
}

async function getUnifiedLogAttributes(
  variables: UnifiedLogAttributesVariables,
  signal?: AbortSignal
) {
  const row = await getLogAttributesRow(variables, signal)
  return row?.log_attributes ?? null
}

export type UnifiedLogAttributesData = Awaited<ReturnType<typeof getUnifiedLogAttributes>>

export const unifiedLogAttributesQueryOptions = ({
  projectRef,
  logId,
  source,
  logTimestampMs,
}: UnifiedLogAttributesVariables) =>
  queryOptions<UnifiedLogAttributesData, UnifiedLogAttributesError>({
    queryKey: logsKeys.logAttributes(projectRef, logId, source, logTimestampMs),
    queryFn: ({ signal }) =>
      getUnifiedLogAttributes({ projectRef, logId, source, logTimestampMs }, signal),
    enabled:
      IS_PLATFORM &&
      typeof projectRef !== 'undefined' &&
      typeof logId !== 'undefined' &&
      typeof source !== 'undefined' &&
      typeof logTimestampMs === 'number' &&
      Number.isFinite(logTimestampMs),
    ...UNIFIED_LOGS_QUERY_OPTIONS,
  })
