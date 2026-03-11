import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  LogsTableName,
  PREVIEWER_DATEPICKER_HELPERS,
  getDefaultHelper,
} from 'components/interfaces/Settings/Logs/Logs.constants'
import type {
  Count,
  EventChart,
  EventChartData,
  Filters,
  LogData,
  Logs,
  LogsEndpointParams,
} from 'components/interfaces/Settings/Logs/Logs.types'
import {
  genChartQuery,
  genCountQuery,
  genDefaultQuery,
} from 'components/interfaces/Settings/Logs/Logs.utils'
import { get } from 'data/fetchers'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'

import { useFillTimeseriesSorted } from './useFillTimeseriesSorted'
import { useLogsUrlState } from './useLogsUrlState'
import useTimeseriesUnixToIso from './useTimeseriesUnixToIso'

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

  const params: LogsEndpointParams = useMemo(() => {
    const currentSql = genDefaultQuery(table, mergedFilters, limit)
    return {
      iso_timestamp_start: timestampStart,
      iso_timestamp_end: timestampEnd,
      sql: currentSql,
    }
  }, [timestampStart, timestampEnd, table, mergedFilters, limit])

  const queryKey = useMemo(() => ['projects', projectRef, 'logs', params], [projectRef, params])

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
      const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: projectRef },
          query: {
            ...params,
            iso_timestamp_end: pageParam || params.iso_timestamp_end,
          },
        },
        signal,
      })
      if (error) {
        throw error
      }

      return data as unknown as Logs
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

  const countQuerySql = useMemo(() => genCountQuery(table, mergedFilters), [table, mergedFilters])
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
      },
    ],
    [projectRef, countQuerySql, latestRefresh, timestampEnd, table, mergedFilters]
  )

  const { data: countData } = useQuery({
    queryKey: countQueryKey,
    queryFn: async ({ signal }) => {
      const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: projectRef },
          query: {
            sql: countQuerySql,
            iso_timestamp_start: latestRefresh,
            iso_timestamp_end: timestampEnd,
          },
        },
        signal,
      })
      if (error) {
        throw error
      }

      return data as unknown as Count
    },
    refetchOnWindowFocus: false,
    refetchInterval: 60000,
    enabled: !error && data && data?.pages?.length > 0 ? true : false,
  })

  const newCount = countData?.result?.[0]?.count ?? 0

  const chartQuery = useMemo(
    () => genChartQuery(table, params, mergedFilters),
    [table, params, mergedFilters]
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
      },
    ],
    [projectRef, chartQuery, timestampStart, timestampEnd]
  )

  const { data: eventChartResponse, refetch: refreshEventChart } = useQuery({
    queryKey: chartQueryKey,
    queryFn: async ({ signal }) => {
      const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: projectRef },
          query: {
            iso_timestamp_start: timestampStart,
            iso_timestamp_end: timestampEnd,
            sql: chartQuery,
          },
        },
        signal,
      })
      if (error) {
        throw error
      }

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
