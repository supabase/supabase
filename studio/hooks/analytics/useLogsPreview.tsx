import {
  cleanQuery,
  Count,
  Filters,
  genCountQuery,
  genDefaultQuery,
  genQueryParams,
  LogData,
  Logs,
  LogsEndpointParams,
  LogsTableName,
} from 'components/interfaces/Settings/Logs'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import useSWR from 'swr'
import useSWRInfinite, { SWRInfiniteKeyLoader } from 'swr/infinite'
import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'

interface Data {
  logData: LogData[]
  error: string | Object | null
  newCount: number
  isLoading: boolean
  pageSize: number
  filters: Filters
  params: LogsEndpointParams
  oldestTimestamp?: string
}
interface Handlers {
  loadOlder: () => void
  refresh: () => void
  setFilters: (filters: Filters | ((previous: Filters) => Filters)) => void
  setFrom: (value: string) => void
  setTo: (value: string) => void
}
function useLogsPreview(
  projectRef: string,
  table: LogsTableName,
  filterOverride?: Filters
): [Data, Handlers] {
  const [latestRefresh, setLatestRefresh] = useState<string>(new Date().toISOString())

  const [filters, setFilters] = useState<Filters>({ ...filterOverride })

  const [params, setParams] = useState<LogsEndpointParams>({
    project: projectRef,
    sql: '',
    rawSql: '',
    period_start: '',
    period_end: '',
    timestamp_start: '',
    timestamp_end: '',
  })

  useEffect(() => {
    if (filters !== {}) {
      refresh()
    }
  }, [JSON.stringify(filters)])

  // handle url generation for log pagination
  const getKeyLogs: SWRInfiniteKeyLoader = (_pageIndex: number, prevPageData: Logs) => {
    let queryParams

    // cancel request if no sql provided
    if(!params.sql) {
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
      // create new key from params
      queryParams = genQueryParams({ ...params, timestamp_end: String(tsLimit) } as any)
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
    if(!params.sql) {
      // return null to restrict unnecessary requests to api
      // https://swr.vercel.app/docs/conditional-fetching#conditional
      return null
    }

    return `${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${genQueryParams(
      {
        ...params,
        sql: genCountQuery(table),
        period_start: String(latestRefresh),
      } as any
    )}`
  }

  const { data: countData } = useSWR<Count>(countUrl, get, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    refreshInterval: 5000,
  })
  const newCount = countData?.result?.[0]?.count ?? 0

  const refresh = async () => {
    const generatedSql = genDefaultQuery(table, filters)
    setParams((prev) => ({ ...prev, sql: cleanQuery(generatedSql), rawSql: generatedSql }))
    setLatestRefresh(new Date().toISOString())
    setSize(1)
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
      setFilters((prev) => ({ ...prev, ...newFilters, ...filterOverride }))
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
    },
    {
      setFrom: (value) => setParams((prev) => ({ ...prev, timestamp_start: value })),
      setTo: (value) => setParams((prev) => ({ ...prev, timestamp_end: value })),
      setFilters: handleSetFilters,
      refresh,
      loadOlder: () => setSize((prev) => prev + 1),
    },
  ]
}
export default useLogsPreview
