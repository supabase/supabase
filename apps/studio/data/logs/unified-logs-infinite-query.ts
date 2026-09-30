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
const LIVE_LOGS_OVERLAP_MS = 2 * 60 * 1000

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

  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)
  const buildQuery = pickLogsQueryBuilder(useOtel, getUnifiedLogsQuery, getUnifiedLogsQueryBq)

  const cursorValue = pageParam?.cursor
  const cursorDirection = pageParam?.direction

  let timestampStart = isoTimestampStart
  let timestampEnd = isoTimestampEnd

  if (cursorDirection === 'prev' && !search.date) {
    timestampStart = new Date(Number(cursorValue) - LIVE_LOGS_OVERLAP_MS).toISOString()
    timestampEnd = new Date().toISOString()
  } else if (cursorDirection === 'next') {
    timestampEnd =
      cursorValue !== null && cursorValue !== undefined
        ? new Date(Number(cursorValue)).toISOString()
        : isoTimestampEnd
  }

  const endpoint = logsAllEndpointUrl(useOtel)
  const fetchPage = async (offset: number) => {
    const sql = safeSql`${buildQuery(search)} ORDER BY timestamp DESC, id DESC LIMIT ${analyticsLiteral(LOGS_PAGE_LIMIT)} OFFSET ${analyticsLiteral(offset)}`
    const data = await executeAnalyticsSql({
      projectRef,
      endpoint,
      sql,
      iso_timestamp_start: timestampStart,
      iso_timestamp_end: timestampEnd,
      signal,
      headers: headersInit,
    })

    if (data.error) handleError(new Error(data.error as string))
    return parseUnifiedLogsQueryRows(data?.result).map(mapUnifiedLogRow)
  }

  let result = await fetchPage(0)

  if (cursorDirection === 'prev') {
    for (let offset = LOGS_PAGE_LIMIT; result.length >= offset; offset += LOGS_PAGE_LIMIT) {
      const page = await fetchPage(offset)
      result = [...result, ...page]
      if (page.length < LOGS_PAGE_LIMIT) break
    }
  }

  const lastRow = result.length > 0 ? result[result.length - 1] : null
  const hasMore = result.length >= LOGS_PAGE_LIMIT - 1

  const nextCursor = lastRow ? lastRow.date.getTime() : null
  const prevCursor = new Date(timestampEnd).getTime()

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
