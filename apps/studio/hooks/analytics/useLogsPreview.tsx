import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'

import { useFillTimeseriesSorted } from './useFillTimeseriesSorted'
import { useLogsUrlState } from './useLogsUrlState'
import useTimeseriesUnixToIso from './useTimeseriesUnixToIso'
import {
  getDefaultHelper,
  LogsTableName,
  PREVIEWER_DATEPICKER_HELPERS,
} from '@/components/interfaces/Settings/Logs/Logs.constants'
import type {
  Count,
  EventChart,
  EventChartData,
  Filters,
  LogData,
  Logs,
  LogsEndpointParams,
} from '@/components/interfaces/Settings/Logs/Logs.types'
import {
  genChartQuery,
  genCountQuery,
  genDefaultQuery,
} from '@/components/interfaces/Settings/Logs/Logs.utils'
import {
  genAttributeHydrationQueryOtel,
  genChartQueryOtel,
  genCountQueryOtel,
  genDefaultQueryOtel,
  mapOtelPreviewRow,
  otelListNeedsHydration,
} from '@/components/interfaces/Settings/Logs/Logs.utils.otel'
import { executeAnalyticsSql } from '@/data/logs/execute-analytics-sql'
import { logsAllEndpointUrl, pickLogsQueryBuilder } from '@/data/logs/logs-endpoint'

// Pads the page's timestamp bracket so a row sitting exactly on the boundary
// isn't dropped by rounding on the way to an ISO string.
const HYDRATION_PADDING_MS = 1000

/**
 * Fetches the attribute-derived columns for one page of already-fetched rows and
 * merges them in, keeping the row shape the renderers already expect.
 *
 * Bounded to the page's own timestamp span — `id` is not in the logs table's
 * sort key, so the time bracket is what keeps this cheap. Returns the rows
 * unchanged if there is nothing to fetch.
 */
async function hydrateOtelPageAttributes({
  rows,
  table,
  projectRef,
  endpoint,
  signal,
}: {
  rows: LogData[]
  table: LogsTableName
  projectRef: string
  endpoint: ReturnType<typeof logsAllEndpointUrl>
  signal?: AbortSignal
}): Promise<LogData[]> {
  const ids = rows
    .map((row) => row.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
  const sql = genAttributeHydrationQueryOtel(table, ids)
  if (sql === null) return rows

  const timestamps = rows.map((row) => Number(row.timestamp)).filter((ts) => Number.isFinite(ts))
  if (timestamps.length === 0) return rows

  const data = await executeAnalyticsSql({
    projectRef,
    endpoint,
    sql,
    iso_timestamp_start: new Date(
      Math.min(...timestamps) / 1000 - HYDRATION_PADDING_MS
    ).toISOString(),
    iso_timestamp_end: new Date(
      Math.max(...timestamps) / 1000 + HYDRATION_PADDING_MS
    ).toISOString(),
    signal,
  })

  return mergeOtelPageAttributes(rows, (data as unknown as Logs)?.result ?? [])
}

/**
 * Merges hydrated attribute columns onto their rows by id. Rows with no match
 * (the attribute query returned fewer rows, or none at all) are passed through
 * unchanged so the list still renders.
 *
 * The list row wins on any shared key. Today `id` is the only one the two
 * projections have in common, but the list query is the one that normalizes
 * `timestamp` to microseconds for the renderers and the pagination cursor — so
 * its values take precedence rather than relying on the projections staying
 * disjoint.
 */
export function mergeOtelPageAttributes(
  rows: LogData[],
  attributeRows: Array<Record<string, any>>
): LogData[] {
  const attributesById = new Map<string, Record<string, unknown>>(
    attributeRows.filter((row) => typeof row?.id === 'string').map((row) => [row.id as string, row])
  )
  if (attributesById.size === 0) return rows

  return rows.map((row) => {
    const attributes = row.id ? attributesById.get(row.id) : undefined
    return attributes ? ({ ...attributes, ...row } as LogData) : row
  })
}

interface LogsPreviewHook {
  logData: LogData[]
  error: string | Object | null
  newCount: number
  isSuccess: boolean
  isLoading: boolean
  isLoadingOlder: boolean
  filters: Filters
  params: LogsEndpointParams
  oldestTimestamp?: string
  eventChartData: EventChartData[]
  loadOlder: () => void
  refresh: () => void
}

function useLogsPreview({
  projectRef,
  table,
  filterOverride,
  limit,
}: {
  projectRef: string
  table: LogsTableName
  filterOverride?: Filters
  limit?: number
}): LogsPreviewHook {
  const defaultHelper = getDefaultHelper(PREVIEWER_DATEPICKER_HELPERS)
  const [latestRefresh, setLatestRefresh] = useState(new Date().toISOString())

  // When on, query the OTEL endpoint instead of BigQuery. logsAllEndpointUrl is
  // inlined in each queryFn (not hoisted) so useOtel stays the only query dep.
  const useOtel = useFlag('otelLegacyLogs')

  const {
    timestampStart: urlTimestampStart,
    timestampEnd: urlTimestampEnd,
    filters: urlFilters,
    search,
  } = useLogsUrlState()

  const timestampStart = useMemo(
    () => urlTimestampStart || defaultHelper.calcFrom(),
    [urlTimestampStart, defaultHelper]
  )
  const timestampEnd = useMemo(
    () => urlTimestampEnd || defaultHelper.calcTo(),
    [urlTimestampEnd, defaultHelper]
  )

  const mergedFilters = useMemo(
    () => ({
      ...urlFilters,
      ...filterOverride,
      ...(search ? { search_query: search } : {}),
    }),
    [JSON.stringify(urlFilters), JSON.stringify(filterOverride), search]
  )

  const defaultSql = useMemo(
    () =>
      pickLogsQueryBuilder(useOtel, genDefaultQueryOtel, genDefaultQuery)(
        table,
        mergedFilters,
        limit
      ),
    [useOtel, table, mergedFilters, limit]
  )

  // When the list query uses the lean projection, its attribute-derived columns
  // come from a second request scoped to the page just returned. See
  // `otelListNeedsHydration` for when this applies.
  const needsHydration = useMemo(
    () => useOtel && otelListNeedsHydration(table, mergedFilters),
    [useOtel, table, mergedFilters]
  )

  const params: LogsEndpointParams = useMemo(
    () => ({
      iso_timestamp_start: timestampStart,
      iso_timestamp_end: timestampEnd,
      sql: defaultSql,
    }),
    [timestampStart, timestampEnd, defaultSql]
  )

  // `table` and `needsHydration` are already implied by `defaultSql`, but the
  // queryFn reads them directly, so they belong in the key.
  const queryKey = useMemo(
    () => [
      'projects',
      projectRef,
      'logs',
      params,
      defaultSql,
      { otel: useOtel, table, needsHydration },
    ],
    [projectRef, params, defaultSql, useOtel, table, needsHydration]
  )

  const {
    data,
    isSuccess,
    isLoading,
    isRefetching,
    error: rqError,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ signal, pageParam }) => {
      const data = await executeAnalyticsSql({
        projectRef,
        endpoint: logsAllEndpointUrl(useOtel),
        sql: defaultSql,
        iso_timestamp_start: params.iso_timestamp_start ?? '',
        iso_timestamp_end: (pageParam || params.iso_timestamp_end) ?? '',
        method: 'get',
        signal,
      })
      const logs = data as unknown as Logs
      if (!useOtel || !logs?.result) return logs

      const result = logs.result.map(mapOtelPreviewRow)
      if (!needsHydration || result.length === 0) return { ...logs, result } as Logs

      try {
        const hydrated = await hydrateOtelPageAttributes({
          rows: result,
          table,
          projectRef,
          endpoint: logsAllEndpointUrl(useOtel),
          signal,
        })
        return { ...logs, result: hydrated } as Logs
      } catch (error) {
        // Attribute columns are supplementary — the row still renders its
        // timestamp and message without them. Don't fail the page over it.
        console.error('Failed to fetch log attributes for page:', error)
        return { ...logs, result } as Logs
      }
    },
    refetchOnWindowFocus: false,
    initialPageParam: undefined as string | undefined,
    getNextPageParam(lastPage) {
      if ((lastPage.result?.length ?? 0) === 0) {
        return undefined
      }
      const len = lastPage.result.length
      const { timestamp: tsLimit }: LogData = lastPage.result[len - 1]
      const isoTsLimit = dayjs.utc(Number(tsLimit / 1000)).toISOString()
      return isoTsLimit
    },
  })

  const { logData, error, oldestTimestamp } = useMemo(() => {
    let logData: LogData[] = []
    let error: null | string | object = rqError ? (rqError as any).message : null

    data?.pages?.forEach((response) => {
      if (response?.result) {
        logData = [...logData, ...response.result]
      }
      if (!error && response?.error) {
        error = response.error
      }
    })

    const oldestTimestamp = logData.length > 0 ? logData[logData.length - 1]?.timestamp : undefined

    return { logData, error, oldestTimestamp }
  }, [data?.pages])

  const countQuerySql = useMemo(
    () => pickLogsQueryBuilder(useOtel, genCountQueryOtel, genCountQuery)(table, mergedFilters),
    [useOtel, table, mergedFilters]
  )
  const countQueryKey = useMemo(
    () => [
      'projects',
      projectRef,
      'logs-count',
      {
        projectRef,
        sql: countQuerySql,
        iso_timestamp_start: latestRefresh,
        iso_timestamp_end: timestampEnd,
        table,
        mergedFilters,
        otel: useOtel,
      },
    ],
    [projectRef, countQuerySql, latestRefresh, timestampEnd, table, mergedFilters, useOtel]
  )

  const { data: countData } = useQuery({
    queryKey: countQueryKey,
    queryFn: async ({ signal }) => {
      const data = await executeAnalyticsSql({
        projectRef,
        endpoint: logsAllEndpointUrl(useOtel),
        sql: countQuerySql,
        iso_timestamp_start: latestRefresh,
        iso_timestamp_end: timestampEnd ?? '',
        method: 'get',
        signal,
      })
      return data as unknown as Count
    },
    refetchOnWindowFocus: false,
    refetchInterval: 60000,
    enabled: !error && data && data?.pages?.length > 0 ? true : false,
  })

  const newCount = countData?.result?.[0]?.count ?? 0

  const chartQuery = useMemo(
    () =>
      pickLogsQueryBuilder(useOtel, genChartQueryOtel, genChartQuery)(table, params, mergedFilters),
    [useOtel, table, params, mergedFilters]
  )
  const chartQueryKey = useMemo(
    () => [
      'projects',
      projectRef,
      'logs-chart',
      {
        projectRef,
        sql: chartQuery,
        iso_timestamp_start: timestampStart,
        iso_timestamp_end: timestampEnd,
        otel: useOtel,
      },
    ],
    [projectRef, chartQuery, timestampStart, timestampEnd, useOtel]
  )

  const { data: eventChartResponse, refetch: refreshEventChart } = useQuery({
    queryKey: chartQueryKey,
    queryFn: async ({ signal }) => {
      const data = await executeAnalyticsSql({
        projectRef,
        endpoint: logsAllEndpointUrl(useOtel),
        sql: chartQuery,
        iso_timestamp_start: timestampStart,
        iso_timestamp_end: timestampEnd ?? '',
        method: 'get',
        signal,
      })
      return data as unknown as EventChart
    },
    refetchOnWindowFocus: false,
  })

  const refresh = useCallback(async () => {
    setLatestRefresh(new Date().toISOString())
    refreshEventChart()
    refetch()
  }, [refetch, refreshEventChart])

  const normalizedEventChartData = useTimeseriesUnixToIso(
    eventChartResponse?.result ?? [],
    'timestamp'
  )

  const { data: eventChartData, error: eventChartError } = useFillTimeseriesSorted({
    data: normalizedEventChartData,
    timestampKey: 'timestamp',
    valueKey: 'count',
    defaultValue: 0,
    startDate: timestampStart,
    endDate: timestampEnd ?? new Date().toISOString(),
  })

  return {
    newCount,
    logData,
    isSuccess,
    isLoading: isLoading || isRefetching,
    isLoadingOlder: isFetchingNextPage,
    error: error || eventChartError,
    filters: mergedFilters,
    params,
    oldestTimestamp: oldestTimestamp ? String(oldestTimestamp) : undefined,
    eventChartData,
    refresh,
    loadOlder: () => fetchNextPage(),
  }
}
export default useLogsPreview
