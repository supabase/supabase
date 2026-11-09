import { z } from 'zod'

import { executeAnalyticsSql } from './execute-analytics-sql'
import { analyticsLiteral as lit, safeSql } from './safe-analytics-sql'
import { getUnifiedLogsISOStartEnd } from './unified-logs-infinite-query'
import { parseUnifiedLogsQueryRows } from './unified-logs.utils'
import { getFunctionLogsQuery } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries.functions'
import type { QuerySearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { handleError } from '@/data/fetchers'

const metadataSchema = z
  .object({
    function_id: z.string(),
    execution_id: z.string().nullish(),
    execution_time_ms: z.number().nullish(),
  })
  .passthrough()

export async function getSelfHostedFunctionInspection(
  {
    projectRef,
    logId,
    search,
  }: { projectRef: string; logId: string; search: QuerySearchParamsType },
  signal?: AbortSignal
) {
  if (!search.scope) throw new Error('Function scope is required')
  const range = getUnifiedLogsISOStartEnd(search)
  const execute = async (sql: ReturnType<typeof getFunctionLogsQuery>) => {
    const data = await executeAnalyticsSql({
      projectRef,
      endpoint: '/platform/projects/{ref}/analytics/endpoints/logs.all',
      sql,
      iso_timestamp_start: range.isoTimestampStart,
      iso_timestamp_end: range.isoTimestampEnd,
      signal,
    })
    if (data.error) handleError(data.error)
    return parseUnifiedLogsQueryRows(data.result)
  }
  const rows = await execute(
    getFunctionLogsQuery(search, safeSql`JSON_VALUE(id, '$') = ${lit(logId)}`).map(
      (query) => safeSql`${query} LIMIT 1`
    )
  )
  const row = rows[0]
  if (!row) return { result: [] }
  const metadata = metadataSchema.parse(row.metadata)
  const relatedSearch = {
    ...search,
    filter: [],
    scope: {
      filters: [
        { column: 'function_id', operator: '=' as const, value: metadata.function_id },
        { column: 'log_type', operator: '=' as const, value: 'edge function runtime' },
      ],
    },
  }
  const related = metadata.execution_id
    ? await execute(
        getFunctionLogsQuery(
          relatedSearch,
          safeSql`runtime_metadata.execution_id = ${lit(metadata.execution_id)}`
        ).map((query) => safeSql`${query} ORDER BY timestamp ASC, id ASC LIMIT 100`)
      )
    : []
  return {
    result: [
      {
        id: row.id,
        timestamp: String(row.timestamp),
        event_message: row.event_message ?? '',
        service_name: 'function_edge_logs',
        method: row.method ?? '',
        path: row.pathname ?? '',
        host: '',
        status_code: String(row.status ?? ''),
        level: row.level ?? '',
        response_time_ms: metadata.execution_time_ms ?? undefined,
        request_path: row.pathname,
        request_method: row.method,
        response_status_code: row.status,
        function_id: metadata.function_id,
        execution_id: metadata.execution_id,
        metadata,
        service_specific_data: metadata,
        function_log_count: related.length,
        function_logs: related.map((log) => ({
          id: log.id,
          timestamp: log.timestamp,
          event_message: log.event_message,
          level: log.metadata?.level,
          event_type: log.metadata?.event_type,
        })),
      },
    ],
  }
}
