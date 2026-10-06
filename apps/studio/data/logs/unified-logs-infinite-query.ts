import {
  InfiniteData,
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useFlag } from 'common'

import { executeAnalyticsSql } from './execute-analytics-sql'
import { logsKeys } from './keys'
import { logsAllEndpointUrl, pickLogsQueryBuilder } from './logs-endpoint'
import { analyticsLiteral, safeSql } from './safe-analytics-sql'
import {
  mapUnifiedLogRow,
  parseUnifiedLogsQueryRows,
  type UnifiedLogsQueryRow,
} from './unified-logs.utils'
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

type RowCursor = Pick<UnifiedLogsQueryRow, 'id' | 'timestamp'>
type RefreshBoundary = { row: RowCursor; hasMore: boolean }
type UnifiedLogsPageParam =
  | (NonNullable<PageParam> & { row?: RowCursor; refreshThrough?: RefreshBoundary })
  | null
  | undefined

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
    refreshThrough = pageParam?.refreshThrough,
  }: UnifiedLogsVariables & {
    pageParam: UnifiedLogsPageParam
    useOtel?: boolean
    refreshThrough?: RefreshBoundary
  },
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
  } else if (cursorDirection === 'next' && !pageParam?.row) {
    timestampEnd =
      cursorValue !== null && cursorValue !== undefined
        ? new Date(Number(cursorValue)).toISOString()
        : isoTimestampEnd
  }

  const endpoint = logsAllEndpointUrl(useOtel)
  const idColumn = useOtel ? safeSql`toString(id)` : safeSql`id`
  const cursorTimestamp = (cursor: RowCursor) => {
    const rawTimestamp = String(cursor.timestamp)
    const isIsoTimestamp = /[T-]/.test(rawTimestamp)
    let timestamp
    if (isIsoTimestamp) {
      timestamp = useOtel
        ? safeSql`parseDateTime64BestEffort(${analyticsLiteral(rawTimestamp)}, 9, 'UTC')`
        : safeSql`CAST(${analyticsLiteral(rawTimestamp)} AS TIMESTAMP)`
    } else {
      timestamp = useOtel
        ? safeSql`fromUnixTimestamp64Micro(${analyticsLiteral(Number(rawTimestamp))})`
        : safeSql`TIMESTAMP_MICROS(${analyticsLiteral(Number(rawTimestamp))})`
    }
    return timestamp
  }
  const fetchPage = async (cursor?: RowCursor) => {
    let paginationFilter
    if (cursor) {
      const timestamp = cursorTimestamp(cursor)
      paginationFilter = safeSql`(timestamp < ${timestamp} OR (timestamp = ${timestamp} AND ${idColumn} < ${analyticsLiteral(cursor.id)}))`
    }
    if (refreshThrough) {
      const timestamp = cursorTimestamp(refreshThrough.row)
      const boundaryFilter = safeSql`(timestamp > ${timestamp} OR (timestamp = ${timestamp} AND ${idColumn} >= ${analyticsLiteral(refreshThrough.row.id)}))`
      paginationFilter = paginationFilter
        ? safeSql`${paginationFilter} AND ${boundaryFilter}`
        : boundaryFilter
    }
    const sql = safeSql`${buildQuery(search, paginationFilter)} ORDER BY timestamp DESC, ${idColumn} DESC LIMIT ${analyticsLiteral(LOGS_PAGE_LIMIT)}`
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
    return parseUnifiedLogsQueryRows(data?.result)
  }

  let page = await fetchPage(pageParam?.row)
  const rows = [...page]

  if (cursorDirection === 'prev' || refreshThrough) {
    while (page.length === LOGS_PAGE_LIMIT) {
      page = await fetchPage(page[page.length - 1])
      rows.push(...page)
    }
  }
  const result = rows.map(mapUnifiedLogRow)

  const lastRow = result.length > 0 ? result[result.length - 1] : null
  const lastQueryRow = rows.length > 0 ? rows[rows.length - 1] : pageParam?.row
  const hasMore = refreshThrough?.hasMore ?? result.length >= LOGS_PAGE_LIMIT - 1

  const nextCursor = lastRow ? lastRow.date.getTime() : (pageParam?.cursor ?? null)
  const prevCursor = new Date(timestampEnd).getTime()

  return {
    data: result,
    nextCursor: hasMore ? nextCursor : null,
    prevCursor,
    nextRow: lastQueryRow ? { id: lastQueryRow.id, timestamp: lastQueryRow.timestamp } : null,
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
    UnifiedLogsPageParam
  > = {}
) => {
  const useOtel = useFlag('otelUnifiedLogs')
  const queryClient = useQueryClient()
  const queryKey = [...logsKeys.unifiedLogsInfinite(projectRef, search), { otel: useOtel }]
  const getCachedPages = () =>
    queryClient.getQueryData<InfiniteData<Awaited<ReturnType<typeof getUnifiedLogs>>>>(queryKey)
      ?.pages ?? []
  const getRefreshBoundary = (page: Awaited<ReturnType<typeof getUnifiedLogs>> | undefined) =>
    page?.nextRow ? { row: page.nextRow, hasMore: page.nextCursor !== null } : undefined
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ signal, pageParam, direction }) => {
      const effectivePageParam =
        pageParam?.direction === 'prev' && direction !== 'backward' ? null : pageParam
      const isRefreshingFirstPage =
        direction !== 'backward' &&
        (effectivePageParam === null || effectivePageParam === undefined)
      return getUnifiedLogs(
        {
          projectRef,
          search,
          pageParam: effectivePageParam,
          useOtel,
          refreshThrough: isRefreshingFirstPage
            ? getRefreshBoundary(getCachedPages().find((page) => page.data.length > 0))
            : effectivePageParam?.refreshThrough,
        },
        signal
      )
    },
    enabled: enabled && typeof projectRef !== 'undefined',
    placeholderData: keepPreviousData,
    getPreviousPageParam: (firstPage) => {
      if (!firstPage.prevCursor) return null
      return { cursor: firstPage.prevCursor, direction: 'prev' } as const
    },
    initialPageParam: null,
    getNextPageParam(lastPage, pages) {
      if (!lastPage.nextCursor || !lastPage.nextRow) return null
      const cachedPages = getCachedPages()
      const isRefreshing = pages[0] !== cachedPages[0]
      const loadedPages = cachedPages.filter((page) => page.data.length > 0)
      if (isRefreshing && pages.length >= loadedPages.length) return null
      return {
        cursor: lastPage.nextCursor,
        direction: 'next',
        row: lastPage.nextRow ?? undefined,
        refreshThrough: isRefreshing ? getRefreshBoundary(loadedPages[pages.length]) : undefined,
      } as const
    },
    ...UNIFIED_LOGS_QUERY_OPTIONS,
    ...options,
  })
}
