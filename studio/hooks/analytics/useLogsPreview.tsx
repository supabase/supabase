import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  Count,
  EventChart,
  EventChartData,
  Filters,
  genChartQuery,
  genCountQuery,
  genDefaultQuery,
  genQueryParams,
  getDefaultHelper,
  LogData,
  Logs,
  LogsEndpointParams,
  LogsTableName,
  PREVIEWER_DATEPICKER_HELPERS,
} from 'components/interfaces/Settings/Logs'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'
import dayjs from 'dayjs'
import useFillTimeseriesSorted from './useFillTimeseriesSorted'
import useTimeseriesUnixToIso from './useTimeseriesUnixToIso'

interface LogsPreviewHook {
  logData: LogData[]
  error: string | Object | null
  newCount: number
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
function useLogsPreview(
  projectRef: string,
  table: LogsTableName,
  filterOverride?: Filters
): LogsPreviewHook {
  const defaultHelper = getDefaultHelper(PREVIEWER_DATEPICKER_HELPERS)
  const [latestRefresh, setLatestRefresh] = useState<string>(new Date().toISOString())

  const [filters, setFilters] = useState<Filters>({ ...filterOverride })
  const isFirstRender = useRef<boolean>(true)

  const [params, setParams] = useState<LogsEndpointParams>({
    project: projectRef,
    sql: genDefaultQuery(table, filters),
    iso_timestamp_start: defaultHelper.calcFrom(),
    iso_timestamp_end: defaultHelper.calcTo(),
  })

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    refresh()
  }, [JSON.stringify(filters)])

  const queryParamsKey = genQueryParams(params as any)

  const {
    data,
    isLoading,
    isRefetching,
    error: rqError,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery(
    ['projects', projectRef, 'logs', queryParamsKey],
    ({ signal, pageParam }) => {
      const uri = `${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${genQueryParams({
        ...params,
        // don't overwrite unless user has already clicked on load older
        iso_timestamp_end: pageParam || params.iso_timestamp_end,
      } as any)}`
      return get<Logs>(
        uri,
        { signal }
      )
    },
    {
      refetchOnWindowFocus: false,
      getNextPageParam(lastPage) {
        if ((lastPage?.result?.length ?? 0) === 0) {
          return undefined
        }
        const len = lastPage.result.length
        const { timestamp: tsLimit }: LogData = lastPage.result[len - 1]
        const isoTsLimit = dayjs.utc(Number(tsLimit / 1000)).toISOString()
        return isoTsLimit
      },
    }
  )

  let logData: LogData[] = []

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
      refetchInterval: 5000,
    }
  )

  const newCount = countData?.result?.[0]?.count ?? 0

  // chart data

  const chartQuery = genChartQuery(table, params, filters)
  const chartUrl = () => {
    return `${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${genQueryParams({
      iso_timestamp_end: params.iso_timestamp_end,
      project: params.project,
      sql: chartQuery,
    } as any)}`
  }

  const { data: eventChartResponse, refetch: refreshEventChart } = useQuery(
    [
      'projects',
      projectRef,
      'logs-chart',
      { iso_timestamp_end: params.iso_timestamp_end, project: params.project, sql: chartQuery },
    ],
    ({ signal }) => get<EventChart>(chartUrl(), { signal }),
    { refetchOnWindowFocus: false }
  )

  const refresh = async () => {
    const generatedSql = genDefaultQuery(table, filters)
    setParams((prev) => ({ ...prev, sql: generatedSql }))
    setLatestRefresh(new Date().toISOString())
    refreshEventChart()
    refetch()
  }

  let error: null | string | object = rqError ? (rqError as any).message : null
  data?.pages.forEach((response) => {
    if (!error && response?.result) {
      logData = [...logData, ...response.result]
    }
    if (!error && response && response.error) {
      error = response.error
    }
  })

  const oldestTimestamp = logData[logData.length - 1]?.timestamp

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
    eventChartResponse?.result || [],
    'timestamp'
  )

  const eventChartData = useFillTimeseriesSorted(
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
    isLoading: isLoading || isRefetching,
    isLoadingOlder: isFetchingNextPage,
    error,
    filters,
    params,
    oldestTimestamp: oldestTimestamp ? String(oldestTimestamp) : undefined,
    eventChartData,
    setFilters: handleSetFilters,
    refresh,
    loadOlder: () => fetchNextPage(),
    setParams,
  }
}
export default useLogsPreview
