import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'

import { getUnifiedLogsQuery } from 'components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import {
  PageParam,
  QuerySearchParamsType,
} from 'components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'
import { logsKeys } from './keys'

const LOGS_PAGE_LIMIT = 50
type LogLevel = 'success' | 'warning' | 'error'
export const UNIFIED_LOGS_STALE_TIME = 1000 * 60 * 5 // 5 minutes

export type UnifiedLogsData = any
export type UnifiedLogsError = ResponseError
export type UnifiedLogsVariables = { projectRef?: string; search: QuerySearchParamsType }

export const getUnifiedLogsISOStartEnd = (search: QuerySearchParamsType) => {
  // Extract date range from search or use default (last hour)
  let isoTimestampStart: string
  let isoTimestampEnd: string

  if (search.date && search.date.length === 2) {
    isoTimestampStart = new Date(search.date[0]).toISOString()
    isoTimestampEnd = new Date(search.date[1]).toISOString()
  } else {
    // Default to last hour
    const now = new Date()
    isoTimestampEnd = now.toISOString()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    isoTimestampStart = oneHourAgo.toISOString()
  }

  return { isoTimestampStart, isoTimestampEnd }
}

/**
 * Refactor notes
 * - Shouldn't need to handle "direction", we store all data as it gets infinitely feteched
 * - Shouldn't need to handle fetching previous too i think
 */

async function getUnifiedLogs(
  { projectRef, search, pageParam }: UnifiedLogsVariables & { pageParam: PageParam },
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined')
    throw new Error('projectRef is required for getUnifiedLogs')

  const cursorValue = pageParam?.cursor // Already in microseconds
  const direction = pageParam?.direction
  const isPagination = pageParam !== undefined
  const sql = `${getUnifiedLogsQuery(search)} ORDER BY timestamp DESC, id DESC LIMIT ${LOGS_PAGE_LIMIT}`

  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)

  let timestampStart: string
  let timestampEnd: string

  if (isPagination && direction === 'prev') {
    // Live mode: fetch logs newer than the cursor
    timestampStart = cursorValue
      ? new Date(Number(cursorValue) / 1000).toISOString() // Convert microseconds to ISO for API
      : isoTimestampStart
    timestampEnd = new Date().toISOString() // Current time as ISO for API
  } else if (isPagination && direction === 'next') {
    // Regular pagination: fetch logs older than the cursor
    timestampStart = isoTimestampStart
    timestampEnd = cursorValue
      ? new Date(Number(cursorValue) / 1000).toISOString() // Convert microseconds to ISO for API
      : isoTimestampEnd
  } else {
    // Initial load: use the original date range
    timestampStart = isoTimestampStart
    timestampEnd = isoTimestampEnd
  }

  const { data, error } = await post(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
    params: { path: { ref: projectRef } },
    body: { iso_timestamp_start: timestampStart, iso_timestamp_end: timestampEnd, sql },
    signal,
  })

  if (error) handleError(error)

  const resultData = data?.result || []

  // Transform results to expected schema
  const result = resultData.map((row: any) => {
    // Create a unique ID using the timestamp
    const uniqueId = `${row.id || 'id'}-${row.timestamp}-${new Date().getTime()}`

    // Create a date object for display purposes
    // The timestamp is in microseconds, need to convert to milliseconds for JS Date
    const date = new Date(Number(row.timestamp) / 1000)

    // Use the level directly from SQL rather than determining it in TypeScript
    const level = row.level as LogLevel

    return {
      id: uniqueId,
      uuid: uniqueId,
      date, // Date object for display purposes
      timestamp: row.timestamp, // Original timestamp from the database
      level,
      status: row.status || 200,
      method: row.method,
      host: row.host,
      pathname: (row.url || '').replace(/^https?:\/\/[^\/]+/, '') || row.path || '',
      event_message: row.event_message || row.body || '',
      headers:
        typeof row.headers === 'string' ? JSON.parse(row.headers || '{}') : row.headers || {},
      regions: row.region ? [row.region] : [],
      log_type: row.log_type || '',
      latency: row.latency || 0,
      log_count: row.log_count || null,
      logs: row.logs || [],
      auth_user: row.auth_user || null,
    }
  })

  // Just use the row timestamps directly for cursors
  const lastRow = result.length > 0 ? result[result.length - 1] : null
  const firstRow = result.length > 0 ? result[0] : null
  const nextCursor = lastRow ? lastRow.timestamp : null

  // This ensures live mode never breaks the infinite query chain
  // DataTableDemo uses milliseconds, but our timestamps are in microseconds
  const prevCursor = result.length > 0 ? firstRow!.timestamp : new Date().getTime() * 1000

  // HACK: Backend uses "timestamp > cursor" which can exclude records with identical timestamps
  // THIS CAN SOMETIMES CAUSE 49 RECORDS INSTEAD OF 50 TO BE RETURNED
  // TODO: Revisit this - ideally the backend should use composite cursors (timestamp+id) for proper pagination
  // For now, we consider either 49 or 50 records as a "full page" to ensure pagination works correctly
  const hasMore = result.length >= LOGS_PAGE_LIMIT - 1

  return {
    data: result,
    prevCursor,
    nextCursor: hasMore ? nextCursor : null,
  }
}

export const useUnifiedLogsInfiniteQuery = <TData = UnifiedLogsData>(
  { projectRef, search }: UnifiedLogsVariables,
  {
    enabled = true,
    ...options
  }: UseInfiniteQueryOptions<UnifiedLogsData, UnifiedLogsError, TData> = {}
) => {
  return useInfiniteQuery<UnifiedLogsData, UnifiedLogsError, TData>(
    logsKeys.unifiedLogsInfinite(projectRef, search),
    ({ signal, pageParam }) => {
      return getUnifiedLogs({ projectRef, search, pageParam }, signal)
    },
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      getNextPageParam(lastPage, pages) {
        // Only return a cursor if we actually have more data to fetch
        if (!lastPage.nextCursor || lastPage.data.length === 0) return null
        // Only trigger fetch when specifically requested, not during column resizing
        return { cursor: lastPage.nextCursor, direction: 'next' } as PageParam
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: 0,
      staleTime: UNIFIED_LOGS_STALE_TIME,
      ...options,
    }
  )
}
