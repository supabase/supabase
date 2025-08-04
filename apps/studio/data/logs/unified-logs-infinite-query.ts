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

export const UNIFIED_LOGS_QUERY_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchInterval: 0,
  staleTime: 1000 * 60 * 5, // 5 minutes,
}

export type UnifiedLogsData = any
export type UnifiedLogsError = ResponseError
export type UnifiedLogsVariables = { projectRef?: string; search: QuerySearchParamsType }

export const getUnifiedLogsISOStartEnd = (
  search: QuerySearchParamsType,
  endHoursFromNow: number = 1
) => {
  // Extract date range from search or use default (last hour)
  let isoTimestampStart: string
  let isoTimestampEnd: string

  if (search.date && search.date.length === 2) {
    const parseDate = (d: string | Date) => (d instanceof Date ? d : new Date(d))
    isoTimestampStart = parseDate(search.date[0]).toISOString()
    isoTimestampEnd = parseDate(search.date[1]).toISOString()
  } else {
    const now = new Date()
    isoTimestampEnd = now.toISOString()
    const nHoursAgo = new Date(now.getTime() - 60 * 60 * (endHoursFromNow * 1000))
    isoTimestampStart = nHoursAgo.toISOString()
  }

  return { isoTimestampStart, isoTimestampEnd }
}

export async function getUnifiedLogs(
  { projectRef, search, pageParam }: UnifiedLogsVariables & { pageParam?: PageParam },
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  if (typeof projectRef === 'undefined')
    throw new Error('projectRef is required for getUnifiedLogs')

  /**
   * [Joshen] RE infinite loading pagination logic for unified logs, these all really should live in the API
   * but for now we're doing these on the FE to move quickly while figuring out what data we need before we
   * migrate this logic to the BE. Just thought to leave a small explanation on the logic here:
   *
   * We're leveraging on the log's timestamp to essentially fetch the next page
   * Given that the logs are ordered descending (latest logs come first, and we're fetching older logs as we scroll down)
   * Hence why the cursor is basically the last row's timestamp from the latest page
   *
   * iso_timestamp_start will always be the current timestamp
   * iso_timestamp_end will default to the last hour for the first page, followed by the last row's timestamp from
   * the previous page.
   *
   * However, just note that this isn't a perfect solution as there's always the edge case where by there's multiple rows
   * with identical timestamps, hence why FE will need a de-duping logic (in UnifiedLogs.tsx) unless we can figure a cleaner
   * solution when we move all this logic to the BE (e.g using composite columns for the cursor like timestamp + id)
   *
   */

  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)
  const sql = `${getUnifiedLogsQuery(search)} ORDER BY timestamp DESC, id DESC LIMIT ${LOGS_PAGE_LIMIT}`

  const cursorValue = pageParam?.cursor
  const cursorDirection = pageParam?.direction

  let timestampStart: string
  let timestampEnd: string

  if (cursorDirection === 'prev') {
    // Live mode: fetch logs newer than the cursor
    timestampStart = cursorValue
      ? new Date(Number(cursorValue) / 1000).toISOString()
      : isoTimestampStart
    timestampEnd = new Date().toISOString()
  } else if (cursorDirection === 'next') {
    // Regular pagination: fetch logs older than the cursor
    timestampStart = isoTimestampStart
    timestampEnd = cursorValue
      ? new Date(Number(cursorValue) / 1000).toISOString()
      : isoTimestampEnd
  } else {
    timestampStart = isoTimestampStart
    timestampEnd = isoTimestampEnd
  }

  let headers = new Headers(headersInit)

  const { data, error } = await post(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
    params: { path: { ref: projectRef } },
    body: { iso_timestamp_start: isoTimestampStart, iso_timestamp_end: timestampEnd, sql },
    signal,
    headers,
  })

  if (error) handleError(error)

  const resultData = data?.result ?? []

  const result = resultData.map((row: any) => {
    // Create a date object for display purposes
    const date = new Date(Number(row.timestamp) / 1000)

    return {
      id: row.id,
      date,
      timestamp: row.timestamp,
      level: row.level as LogLevel,
      status: row.status || 200,
      method: row.method,
      host: row.host,
      pathname: (row.url || '').replace(/^https?:\/\/[^\/]+/, '') || row.pathname || '',
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

  const firstRow = result.length > 0 ? result[0] : null
  const lastRow = result.length > 0 ? result[result.length - 1] : null
  const hasMore = result.length >= LOGS_PAGE_LIMIT - 1

  const nextCursor = lastRow ? lastRow.timestamp : null
  // FIXED: Always provide prevCursor like DataTableDemo does
  // This ensures live mode never breaks the infinite query chain
  // DataTableDemo uses milliseconds, but our timestamps are in microseconds
  const prevCursor = result.length > 0 ? firstRow!.timestamp : new Date().getTime() * 1000

  return {
    data: result,
    nextCursor: hasMore ? nextCursor : null,
    prevCursor,
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
      keepPreviousData: true,
      getPreviousPageParam: (firstPage) => {
        if (!firstPage.prevCursor) return null
        const result = { cursor: firstPage.prevCursor, direction: 'prev' }
        return result
      },
      getNextPageParam(lastPage) {
        if (!lastPage.nextCursor || lastPage.data.length === 0) return null
        return { cursor: lastPage.nextCursor, direction: 'next' }
      },
      ...UNIFIED_LOGS_QUERY_OPTIONS,
      ...options,
    }
  )
}
