import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'

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
import { useLogsUrlState } from './useLogsUrlState'
import { useFillTimeseriesSorted } from './useFillTimeseriesSorted'
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
  const isFirstRender = useRef<boolean>(true)

  const {
    timestampStart: urlTimestampStart = defaultHelper.calcFrom(),
    timestampEnd: urlTimestampEnd = defaultHelper.calcTo(),
    filters: urlFilters,
    search,
  } = useLogsUrlState()

  // Ensure we never pass null to the API
  const timestampStart = urlTimestampStart || defaultHelper.calcFrom()
  const timestampEnd = urlTimestampEnd || defaultHelper.calcTo()

  const mergedFilters = useMemo(
    () => ({
      ...urlFilters,
      ...filterOverride,
      ...(search ? { search_query: search } : {}),
    }),
    [urlFilters, filterOverride, search]
  )

  const [sql, setSQL] = useState(genDefaultQuery(table, mergedFilters, limit))

  const params: LogsEndpointParams = {
    project: projectRef,
    iso_timestamp_start: timestampStart,
    iso_timestamp_end: timestampEnd,
    sql,
  }

  const {
    data,
    isSuccess,
    isLoading,
    isRefetching,
    error: rqError,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery(
    ['projects', projectRef, 'logs', params],
    async ({ signal, pageParam }) => {
      const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: projectRef },
          query: {
            ...params,
            // don't overwrite unless user has already clicked on load older
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
    {
      refetchOnWindowFocus: false,
      getNextPageParam(lastPage) {
        if ((lastPage.result?.length ?? 0) === 0) {
          return undefined
        }
        const len = lastPage.result.length
        const { timestamp: tsLimit }: LogData = lastPage.result[len - 1]
        const isoTsLimit = dayjs.utc(Number(tsLimit / 1000)).toISOString()
        return isoTsLimit
      },
    }
  )

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const newSql = genDefaultQuery(table, mergedFilters, limit)
    setSQL(newSql)
    refresh(newSql)
  }, [JSON.stringify(mergedFilters)])

  // memoize all this calculations stuff
  const { logData, error, oldestTimestamp } = useMemo(() => {
    let logData: LogData[] = []

    let error: null | string | object = rqError ? (rqError as any).message : null
    data?.pages.forEach((response) => {
      if (response.result) {
        logData = [...logData, ...response.result]
      }
      if (!error && response && response.error) {
        error = response.error
      }
    })

    const oldestTimestamp = logData[logData.length - 1]?.timestamp

    return { logData, error, oldestTimestamp }
  }, [data?.pages])

  const { data: countData } = useQuery(
    [
      'projects',
      projectRef,
      'logs-count',
      { ...params, sql: genCountQuery(table, mergedFilters), timestampStart, latestRefresh },
    ],
    async ({ signal }) => {
      const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: projectRef },
          query: {
            ...params,
            sql: genCountQuery(table, mergedFilters),
            iso_timestamp_start: latestRefresh,
          },
        },
        signal,
      })
      if (error) {
        throw error
      }

      return data as unknown as Count
    },
    {
      refetchOnWindowFocus: false,
      // refresh each minute only
      refetchInterval: 60000,
      // only enable if no errors are found and data has already been loaded
      enabled: !error && data && data.pages.length > 0 ? true : false,
    }
  )

  const newCount = countData?.result?.[0]?.count ?? 0

  // chart data
  const chartQuery = useMemo(
    () => genChartQuery(table, params, mergedFilters),
    [table, params.iso_timestamp_end, params.project, mergedFilters]
  )
  const { data: eventChartResponse, refetch: refreshEventChart } = useQuery(
    [
      'projects',
      projectRef,
      'logs-chart',
      { iso_timestamp_end: params.iso_timestamp_end, project: params.project, sql: chartQuery },
    ],
    async ({ signal }) => {
      const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: projectRef },
          query: {
            iso_timestamp_start: params.iso_timestamp_start ?? '',
            iso_timestamp_end: params.iso_timestamp_end ?? '',
            project: params.project ?? '',
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
    { refetchOnWindowFocus: false }
  )

  const refresh = async (newSql?: string) => {
    const generatedSql = newSql || genDefaultQuery(table, mergedFilters, limit)
    setSQL(generatedSql)
    refreshEventChart()
    setLatestRefresh(new Date().toISOString())
    refetch()
  }

  // Update query params when timestamps change
  useEffect(() => {
    params.iso_timestamp_start = timestampStart
    params.iso_timestamp_end = timestampEnd
  }, [timestampStart, timestampEnd])

  const normalizedEventChartData = useTimeseriesUnixToIso(
    eventChartResponse?.result ?? [],
    'timestamp'
  )

  const { data: eventChartData, error: eventChartError } = useFillTimeseriesSorted(
    normalizedEventChartData,
    'timestamp',
    'count',
    0,
    params.iso_timestamp_start,
    // default to current time if not set
    params.iso_timestamp_end || new Date().toISOString()
  )

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
