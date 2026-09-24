import { queryOptions, type QueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { logsKeys } from './keys'
import {
  getLogTimeWindow,
  runOtelLogsSql,
  unifiedLogAttributesQueryOptions,
  type UnifiedLogAttributesVariables,
} from './unified-log-attributes-query'
import { UNIFIED_LOGS_QUERY_OPTIONS } from './unified-logs-infinite-query'
import { mapUnifiedLogRow, unifiedLogsQueryRowSchema } from './unified-logs.utils'
import {
  getRequestCorrelationIds,
  getRequestTimelineQuery,
  type RequestCorrelationIds,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import type { ColumnSchema } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.schema'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

// Related logs can trail the request (e.g. a slow Edge Function), so they get
// a wider window than the selected log's own lookup.
const TIMELINE_WINDOW_MS = 5 * 60 * 1000

// Following IDs found on related logs (e.g. an Edge Function's execution ID)
// can surface more logs; stop after one extra hop.
const MAX_LOOKUPS = 2

const timelineRowSchema = unifiedLogsQueryRowSchema.extend({ source: z.string() })

export type UnifiedLogRequestTimelineVariables = UnifiedLogAttributesVariables

export type UnifiedLogRequestTimelineError = ResponseError

const hasNewIds = (next: RequestCorrelationIds, prev: RequestCorrelationIds) =>
  next.requestIds.some((id) => !prev.requestIds.includes(id)) ||
  next.executionIds.some((id) => !prev.executionIds.includes(id))

async function getUnifiedLogRequestTimeline(
  { projectRef, logId, source, logTimestampMs }: UnifiedLogRequestTimelineVariables,
  queryClient: QueryClient,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!logId) throw new Error('logId is required')
  if (!source) throw new Error('source is required')
  if (typeof logTimestampMs !== 'number' || !Number.isFinite(logTimestampMs)) {
    throw new Error('logTimestampMs is required')
  }

  const root = await queryClient.fetchQuery(
    unifiedLogAttributesQueryOptions({ projectRef, logId, source, logTimestampMs })
  )
  // A shared attribute lookup may outlive this timeline request.
  signal?.throwIfAborted()

  let ids = getRequestCorrelationIds(
    root ? [{ source: root.source, attributes: root.log_attributes }] : []
  )
  let rows: z.infer<typeof timelineRowSchema>[] = []

  for (let lookup = 0; lookup < MAX_LOOKUPS; lookup++) {
    if (ids.requestIds.length === 0 && ids.executionIds.length === 0) break

    const result = await runOtelLogsSql({
      projectRef,
      sql: getRequestTimelineQuery(ids),
      ...getLogTimeWindow(logTimestampMs, TIMELINE_WINDOW_MS),
      signal,
    })
    rows = z.array(timelineRowSchema).parse(result)

    const found = getRequestCorrelationIds(
      rows.map((row) => ({ source: row.source, attributes: row.metadata }))
    )
    if (!hasNewIds(found, ids)) break
    ids = {
      requestIds: [...new Set([...ids.requestIds, ...found.requestIds])],
      executionIds: [...new Set([...ids.executionIds, ...found.executionIds])],
    }
  }

  // Related logs can come from sources the row list doesn't show (e.g.
  // `function_logs`), so `log_type` may fall outside the list's log types.
  const logs = rows.map(
    (row) => ({ ...mapUnifiedLogRow(row), metadata: row.metadata ?? null }) as ColumnSchema
  )

  return { requestIds: ids.requestIds, executionIds: ids.executionIds, logs }
}

export type UnifiedLogRequestTimelineData = Awaited<ReturnType<typeof getUnifiedLogRequestTimeline>>

export const unifiedLogRequestTimelineQueryOptions = ({
  projectRef,
  logId,
  source,
  logTimestampMs,
}: UnifiedLogRequestTimelineVariables) =>
  queryOptions<UnifiedLogRequestTimelineData, UnifiedLogRequestTimelineError>({
    queryKey: logsKeys.requestTimeline(projectRef, logId, source, logTimestampMs),
    queryFn: ({ client, signal }) =>
      getUnifiedLogRequestTimeline({ projectRef, logId, source, logTimestampMs }, client, signal),
    enabled:
      IS_PLATFORM &&
      typeof projectRef !== 'undefined' &&
      typeof logId !== 'undefined' &&
      typeof source !== 'undefined' &&
      typeof logTimestampMs === 'number' &&
      Number.isFinite(logTimestampMs),
    ...UNIFIED_LOGS_QUERY_OPTIONS,
  })
