import { InfiniteData, keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useFeatureFlags } from 'common'

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

type RowCursor = Pick<UnifiedLogsQueryRow, 'id' | 'timestamp'>
type UnifiedLogsPageParam = (NonNullable<PageParam> & { row?: RowCursor }) | null | undefined

export const UNIFIED_LOGS_QUERY_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchInterval: 0,
  staleTime: 1000 * 60 * 5, // 5 minutes,
}

export type UnifiedLogsData = Awaited<ReturnType<typeof getUnifiedLogs>>
export type UnifiedLogsError = ResponseError
export type UnifiedLogsVariables = { projectRef?: string; search: QuerySearchParamsType }

export const useUnifiedLogsBackend = () => {
  const { otelUnifiedLogs = true } = useFeatureFlags().configcat
  return typeof otelUnifiedLogs === 'boolean' ? otelUnifiedLogs : true
}

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
  }: UnifiedLogsVariables & {
    pageParam: UnifiedLogsPageParam
    useOtel?: boolean
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

  let timestampEnd = isoTimestampEnd

  if (cursorDirection === 'prev') {
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
    const sql = safeSql`${buildQuery(search, paginationFilter)} ORDER BY timestamp DESC, ${idColumn} DESC LIMIT ${analyticsLiteral(LOGS_PAGE_LIMIT)}`
    const data = await executeAnalyticsSql({
      projectRef,
      endpoint,
      sql,
      iso_timestamp_start: isoTimestampStart,
      iso_timestamp_end: timestampEnd,
      signal,
      headers: headersInit,
    })

    if (data.error) handleError(new Error(data.error as string))
    return parseUnifiedLogsQueryRows(data?.result)
  }

  const rows = await fetchPage(pageParam?.row)
  const result = rows.map(mapUnifiedLogRow)

  const firstRow = result.length > 0 ? result[0] : null
  const lastRow = result.length > 0 ? result[result.length - 1] : null
  const lastQueryRow = rows.length > 0 ? rows[rows.length - 1] : pageParam?.row
  const hasMore = result.length >= LOGS_PAGE_LIMIT - 1

  const nextCursor = lastRow ? lastRow.date.getTime() : (pageParam?.cursor ?? null)
  const prevCursor = firstRow ? firstRow.date.getTime() : new Date().getTime()

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
  const useOtel = useUnifiedLogsBackend()
  return useInfiniteQuery({
    queryKey: [...logsKeys.unifiedLogsInfinite(projectRef, search), { otel: useOtel }],
    queryFn: ({ signal, pageParam }) =>
      getUnifiedLogs({ projectRef, search, pageParam, useOtel }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    placeholderData: keepPreviousData,
    getPreviousPageParam: (firstPage) => {
      if (!firstPage.prevCursor) return null
      return { cursor: firstPage.prevCursor, direction: 'prev' } as const
    },
    initialPageParam: null,
    getNextPageParam(lastPage) {
      if (!lastPage.nextCursor || !lastPage.nextRow) return null
      return {
        cursor: lastPage.nextCursor,
        direction: 'next',
        row: lastPage.nextRow ?? undefined,
      } as const
    },
    ...UNIFIED_LOGS_QUERY_OPTIONS,
    ...options,
  })
}
