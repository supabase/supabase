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
import useSWR from 'swr'
import useSWRInfinite, { SWRInfiniteKeyLoader } from 'swr/infinite'
import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'
import dayjs from 'dayjs'

interface Data {
  logData: LogData[]
  error: string | Object | null
  newCount: number
  isLoading: boolean
  pageSize: number
  filters: Filters
  params: LogsEndpointParams
  oldestTimestamp?: string
  eventChartData: EventChartData[] | null
}
interface Handlers {
  loadOlder: () => void
  refresh: () => void
  setFilters: (filters: Filters | ((previous: Filters) => Filters)) => void
  setParams: Dispatch<SetStateAction<LogsEndpointParams>>
}
function useLogsPreview(
  projectRef: string,
  table: LogsTableName,
  filterOverride?: Filters
): [Data, Handlers] {
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

  // handle url generation for log pagination
  const getKeyLogs: SWRInfiniteKeyLoader = (_pageIndex: number, prevPageData: Logs) => {
    let queryParams

    // cancel request if no sql provided
    if (!params.sql) {
      // return null to restrict unnecessary requests to api
      // https://swr.vercel.app/docs/conditional-fetching#conditional
      return null
    }

    // if prev page data is 100 items, could possibly have more records that are not yet fetched within this interval
    if (prevPageData === null) {
      // reduce interval window limit by using the timestamp of the last log
      queryParams = genQueryParams(params as any)
    } else if ((prevPageData.result ?? []).length === 0) {
      // no rows returned, indicates that no more data to retrieve and append.
      return null
    } else {
      const len = prevPageData.result.length
      const { timestamp: tsLimit }: LogData = prevPageData.result[len - 1]
      const isoTsLimit = dayjs.utc(Number(tsLimit / 1000)).toISOString()
      // create new key from params
      queryParams = genQueryParams({ ...params, iso_timestamp_end: isoTsLimit } as any)
    }
    return `${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${queryParams}`
  }

  const {
    data = [],
    error: swrError,
    isValidating,
    size,
    setSize,
  } = useSWRInfinite<Logs>(getKeyLogs, get, { revalidateOnFocus: false, dedupingInterval: 3000 })
  let logData: LogData[] = []

  const countUrl = () => {
    // cancel request if no sql provided
    if (!params.sql) {
      // return null to restrict unnecessary requests to api
      // https://swr.vercel.app/docs/conditional-fetching#conditional
      return null
    }

    return `${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${genQueryParams({
      ...params,
      sql: genCountQuery(table, filters),
      iso_timestamp_start: latestRefresh,
    } as any)}`
  }

  const { data: countData } = useSWR<Count>(countUrl, get, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    refreshInterval: 5000,
  })
  const newCount = countData?.result?.[0]?.count ?? 0

  // chart data

  const chartQuery = genChartQuery(table, params, filters)
  const chartUrl = () => {
    // cancel request if no sql provided
    if (!params.sql) {
      // return null to restrict unnecessary requests to api
      // https://swr.vercel.app/docs/conditional-fetching#conditional
      return null
    }

    return `${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${genQueryParams({
      iso_timestamp_end: params.iso_timestamp_end,
      project: params.project,
      sql: chartQuery,
    } as any)}`
  }

  const { data: eventChartResponse, mutate: refreshEventChart } = useSWR<EventChart>(
    chartUrl,
    get,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      refreshInterval: 0,
    }
  )

  const refresh = async () => {
    const generatedSql = genDefaultQuery(table, filters)
    setParams((prev) => ({ ...prev, sql: generatedSql }))
    setLatestRefresh(new Date().toISOString())
    setSize(1)
    refreshEventChart()
  }

  let error: null | string | object = swrError ? swrError.message : null
  data.forEach((response) => {
    if (!error && response?.result) {
      logData = [...logData, ...response.result]
    }
    if (!error && response && response.error) {
      error = response.error
    }
  })

  const oldestTimestamp = logData[logData.length - 1]?.timestamp

  const handleSetFilters: Handlers['setFilters'] = (newFilters) => {
    if (typeof newFilters === 'function') {
      setFilters((prev) => {
        const resolved = newFilters(prev)
        return { ...resolved, ...filterOverride }
      })
    } else {
      setFilters({ ...newFilters, ...filterOverride })
    }
  }
  return [
    {
      newCount,
      logData,
      isLoading: isValidating,
      pageSize: size,
      error,
      filters,
      params,
      oldestTimestamp: oldestTimestamp ? String(oldestTimestamp) : undefined,
      eventChartData: eventChartResponse?.result || null,
    },
    {
      setFilters: handleSetFilters,
      refresh,
      loadOlder: () => setSize((prev) => prev + 1),
      setParams,
    },
  ]
}
export default useLogsPreview
