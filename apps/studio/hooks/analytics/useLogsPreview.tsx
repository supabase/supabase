import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react'

import {
  LogsTableName,
  PREVIEWER_DATEPICKER_HELPERS,
  genQueryParams,
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
import { get, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useFillTimeseriesSorted } from './useFillTimeseriesSorted'
import useTimeseriesUnixToIso from './useTimeseriesUnixToIso'
import { parseAsString, useQueryStates } from 'nuqs'

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
  setFilters: (filters: Filters | ((previous: Filters) => Filters)) => void
  setParams: Dispatch<SetStateAction<LogsEndpointParams>>
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
  const [latestRefresh, setLatestRefresh] = useState<string>(new Date().toISOString())

  const [filters, setFilters] = useState<Filters>({ ...filterOverride })
  const isFirstRender = useRef<boolean>(true)

  const [queryParams, setQueryParams] = useQueryStates({
    project: parseAsString.withDefault(projectRef),
    iso_timestamp_start: parseAsString.withDefault(defaultHelper.calcFrom()),
    iso_timestamp_end: parseAsString.withDefault(defaultHelper.calcTo()),
  })

  const [sql, setSQL] = useState(genDefaultQuery(table, filters, limit))

  const params: LogsEndpointParams = { ...queryParams, sql }

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
    ({ signal, pageParam }) => {
      const uri = `${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${genQueryParams({
        ...params,
        // don't overwrite unless user has already clicked on load older
        iso_timestamp_end: pageParam || params.iso_timestamp_end,
      } as any)}`
      return get<Logs>(uri, { signal })
    },
    {
      refetchOnWindowFocus: false,
      getNextPageParam(lastPage) {
        if (!isResponseOk(lastPage) || (lastPage.result?.length ?? 0) === 0) {
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
    const newSql = genDefaultQuery(table, filters, limit)
    setSQL(newSql)
    refresh(newSql)
  }, [JSON.stringify(filters)])

  // memoize all this calculations stuff
  const { logData, error, oldestTimestamp } = useMemo(() => {
    let logData: LogData[] = []

    let error: null | string | object = rqError ? (rqError as any).message : null
    data?.pages.forEach((response) => {
      if (isResponseOk(response) && response.result) {
        logData = [...logData, ...response.result]
      }
      if (!error && response && response.error) {
        error = response.error
      }
    })

    const oldestTimestamp = logData[logData.length - 1]?.timestamp

    return { logData, error, oldestTimestamp }
  }, [data?.pages])

  const countUrl = () => {
    return `${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${genQueryParams({
      ...params,
      sql: genCountQuery(table, filters),
      iso_timestamp_start: latestRefresh,
    } as any)}`
  }

  const { data: countData } = useQuery(
    [
      'projects',
      projectRef,
      'logs-count',
      { ...params, sql: genCountQuery(table, filters), iso_timestamp_start: latestRefresh },
    ],
    ({ signal }) => get<Count>(countUrl(), { signal }),
    {
      refetchOnWindowFocus: false,
      // refresh each minute only
      refetchInterval: 60000,
      // only enable if no errors are found and data has already been loaded
      enabled: !error && data && data.pages.length > 0 ? true : false,
    }
  )

  const newCount = isResponseOk(countData) ? countData.result?.[0]?.count ?? 0 : 0

  // chart data

  const chartQuery = useMemo(() => genChartQuery(table, params, filters), [params, filters])
  const chartUrl = useMemo(() => {
    return `${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${genQueryParams({
      iso_timestamp_end: params.iso_timestamp_end,
      project: params.project,
      sql: chartQuery,
    } as any)}`
  }, [params, chartQuery])

  const { data: eventChartResponse, refetch: refreshEventChart } = useQuery(
    [
      'projects',
      projectRef,
      'logs-chart',
      { iso_timestamp_end: params.iso_timestamp_end, project: params.project, sql: chartQuery },
    ],
    ({ signal }) => get<EventChart>(chartUrl, { signal }),
    { refetchOnWindowFocus: false }
  )

  const refresh = async (newSql?: string) => {
    const generatedSql = newSql || genDefaultQuery(table, filters, limit)
    setSQL(generatedSql)
    setQueryParams((prev) => ({ ...prev, sql: generatedSql }))
    setLatestRefresh(new Date().toISOString())
    refreshEventChart()
    refetch()
  }

  const handleSetFilters: LogsPreviewHook['setFilters'] = (newFilters) => {
    if (typeof newFilters === 'function') {
      setFilters((prev) => {
        const resolved = newFilters(prev)
        return { ...resolved, ...filterOverride }
      })
    } else {
      setFilters({ ...newFilters, ...filterOverride })
    }
  }

  const normalizedEventChartData = useTimeseriesUnixToIso(
    (isResponseOk(eventChartResponse) && eventChartResponse.result) || [],
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
    filters,
    params,
    oldestTimestamp: oldestTimestamp ? String(oldestTimestamp) : undefined,
    eventChartData,
    setFilters: handleSetFilters,
    refresh,
    loadOlder: () => fetchNextPage(),
    setParams: setQueryParams,
  }
}
export default useLogsPreview
