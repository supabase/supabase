import { InfiniteData, keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useFlag } from 'common'

import { logsKeys } from './keys'
import { logsAllEndpointUrl, pickLogsQueryBuilder } from './logs-endpoint'
import { getUnifiedLogsQuery } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import { getUnifiedLogsQuery as getUnifiedLogsQueryBq } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries.bq'
import {
  PageParam,
  QuerySearchParamsType,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomInfiniteQueryOptions } from '@/types'

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
  const buildQuery = pickLogsQueryBuilder(useOtel, getUnifiedLogsQuery, getUnifiedLogsQueryBq)
  const sql = `${buildQuery(search)} ORDER BY timestamp DESC, id DESC LIMIT ${LOGS_PAGE_LIMIT}`

  const cursorValue = pageParam?.cursor
  const cursorDirection = pageParam?.direction

  let timestampEnd: string

  if (cursorDirection === 'prev') {
    // Live mode: fetch logs newer than the cursor
    timestampEnd = new Date().toISOString()
  } else if (cursorDirection === 'next') {
    // Regular pagination: fetch logs older than the cursor.
    // The cursor is stored as milliseconds (set below from `date.getTime()`),
    // so we can convert it directly without worrying about the wire format.
    timestampEnd =
      cursorValue !== null && cursorValue !== undefined
        ? new Date(Number(cursorValue)).toISOString()
        : isoTimestampEnd
  } else {
    timestampEnd = isoTimestampEnd
  }

  let headers = new Headers(headersInit)

  const endpoint = logsAllEndpointUrl(useOtel)
  const { data, error } = await post(endpoint, {
    params: { path: { ref: projectRef } },
    body: { iso_timestamp_start: isoTimestampStart, iso_timestamp_end: timestampEnd, sql },
    signal,
    headers,
  })

  if (error) handleError(error)

  const resultData = data?.result ?? []

  const result = resultData.map((row: any) => {
    // Disambiguate timestamp shape by format, not by Number.isFinite — a
    // numeric string of microseconds is always finite, so checking finite-
    // ness can't tell us whether the value is microseconds or already-ms.
    // ISO-like strings contain `T` or `-` and are parsed via Date; anything
    // else is treated as numeric microseconds-since-epoch.
    const ts = String(row.timestamp ?? '')
    const looksLikeIso = /[T-]/.test(ts)
    const date = looksLikeIso
      ? new Date(/Z$|[+-]\d{2}:?\d{2}$/.test(ts) ? ts : `${ts}Z`)
      : new Date(Number(ts) / 1000)

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
