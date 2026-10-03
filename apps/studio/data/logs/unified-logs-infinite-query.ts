import { InfiniteData, keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useFlag } from 'common'

import { executeAnalyticsSql } from './execute-analytics-sql'
import { logsKeys } from './keys'
import { logsAllEndpointUrl, pickLogsQueryBuilder } from './logs-endpoint'
import { analyticsLiteral, safeSql } from './safe-analytics-sql'
import { mapUnifiedLogRow, parseUnifiedLogsQueryRows } from './unified-logs.utils'
import { getUnifiedLogsQuery } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import { getUnifiedLogsQuery as getUnifiedLogsQueryBq } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries.bq'
import {
  PageParam,
  QuerySearchParamsType,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomInfiniteQueryOptions } from '@/types'

const LOGS_PAGE_LIMIT = 50

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

// Live mode re-reads this much before the newest row it already has, so logs
// that are ingested late still show up. Rows it already has are de-duplicated
// by id in UnifiedLogs.tsx.
export const LIVE_MODE_OVERLAP_MS = 60 * 1000

/**
 * Time range for one page of the unified logs list:
 * - First page: the selected search range.
 * - Next page (scrolling down): from the range start up to the oldest row loaded so far.
 * - Previous page (live mode polling): from just before the newest row loaded so far up to now.
 *   Starting at the cursor rather than the range start keeps each poll to the new logs only,
 *   instead of re-reading the whole range every few seconds.
 *
 * Cursors are row timestamps in milliseconds.
 */
export const getUnifiedLogsPageRange = (
  search: QuerySearchParamsType,
  pageParam: PageParam | null,
  now: Date = new Date()
): { isoTimestampStart: string; isoTimestampEnd: string } => {
  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)
  const cursor = pageParam?.cursor
  const hasCursor = cursor !== null && cursor !== undefined && Number.isFinite(Number(cursor))

  if (pageParam?.direction === 'prev') {
    if (!hasCursor) return { isoTimestampStart, isoTimestampEnd: now.toISOString() }
    const liveStartMs = Math.max(
      new Date(isoTimestampStart).getTime(),
      Number(cursor) - LIVE_MODE_OVERLAP_MS
    )
    return {
      isoTimestampStart: new Date(liveStartMs).toISOString(),
      isoTimestampEnd: now.toISOString(),
    }
  }

  if (pageParam?.direction === 'next' && hasCursor) {
    return { isoTimestampStart, isoTimestampEnd: new Date(Number(cursor)).toISOString() }
  }

  return { isoTimestampStart, isoTimestampEnd }
}

export async function getUnifiedLogs(
  {
    projectRef,
    search,
    pageParam,
    useOtel = false,
  }: UnifiedLogsVariables & { pageParam: PageParam | null; useOtel?: boolean },
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
   * See getUnifiedLogsPageRange for the time range each page covers.
   *
   * However, just note that this isn't a perfect solution as there's always the edge case where by there's multiple rows
   * with identical timestamps, hence why FE will need a de-duping logic (in UnifiedLogs.tsx) unless we can figure a cleaner
   * solution when we move all this logic to the BE (e.g using composite columns for the cursor like timestamp + id)
   *
   */

  const buildQuery = pickLogsQueryBuilder(useOtel, getUnifiedLogsQuery, getUnifiedLogsQueryBq)
  const sql = safeSql`${buildQuery(search)} ORDER BY timestamp DESC, id DESC LIMIT ${analyticsLiteral(LOGS_PAGE_LIMIT)}`
  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsPageRange(search, pageParam)

  const endpoint = logsAllEndpointUrl(useOtel)
  const data = await executeAnalyticsSql({
    projectRef,
    endpoint,
    sql,
    iso_timestamp_start: isoTimestampStart,
    iso_timestamp_end: isoTimestampEnd,
    signal,
    headers: headersInit,
  })

  if (data.error) handleError(new Error(data.error as string))

  const resultData = parseUnifiedLogsQueryRows(data?.result)
  const result = resultData.map(mapUnifiedLogRow)

  const firstRow = result.length > 0 ? result[0] : null
  const lastRow = result.length > 0 ? result[result.length - 1] : null
  const hasMore = result.length >= LOGS_PAGE_LIMIT - 1

  // Cursors are stored as milliseconds (Date.getTime()) so the OTEL endpoint's
  // wire format (ISO string vs numeric microseconds) doesn't bleed into pagination.
  const nextCursor = lastRow ? lastRow.date.getTime() : null
  const prevCursor = firstRow ? firstRow.date.getTime() : new Date().getTime()

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
  }: UseCustomInfiniteQueryOptions<
    UnifiedLogsData,
    UnifiedLogsError,
    InfiniteData<TData>,
    readonly unknown[],
    PageParam | null
  > = {}
) => {
  const useOtel = useFlag('otelUnifiedLogs')
  return useInfiniteQuery({
    queryKey: [...logsKeys.unifiedLogsInfinite(projectRef, search), { otel: useOtel }],
    queryFn: ({ signal, pageParam }) => {
      return getUnifiedLogs({ projectRef, search, pageParam, useOtel }, signal)
    },
    enabled: enabled && typeof projectRef !== 'undefined',
    placeholderData: keepPreviousData,
    getPreviousPageParam: (firstPage) => {
      if (!firstPage.prevCursor) return null
      return { cursor: firstPage.prevCursor, direction: 'prev' } as const
    },
    initialPageParam: null,
    getNextPageParam(lastPage) {
      if (!lastPage.nextCursor || lastPage.data.length === 0) return null
      return { cursor: lastPage.nextCursor, direction: 'next' } as const
    },
    ...UNIFIED_LOGS_QUERY_OPTIONS,
    ...options,
  })
}
