import { cleanQuery, genQueryParams } from 'components/interfaces/Settings/Logs'
import { Dispatch, SetStateAction, useState } from 'react'
import { LogsEndpointParams, Logs, LogData } from 'components/interfaces/Settings/Logs/Logs.types'
import useSWRInfinite, { SWRInfiniteKeyLoader } from 'swr/infinite/dist/infinite'
import { API_URL } from 'lib/constants'
import useSWR, { mutate } from 'swr'
import { get } from 'lib/common/fetch'
interface Data {
  params: LogsEndpointParams
  isLoading: boolean
  logData: LogData[]
  error: string | Object | null
}
interface Handlers {
  changeQuery: (newQuery?: string) => void
  runQuery: () => void
}

const useLogsQuery = (
  projectRef: string,
  initialParams: Partial<LogsEndpointParams> = {}
): [Data, Handlers] => {
  const [params, setParams] = useState<LogsEndpointParams>({
    project: projectRef,
    sql: '',
    rawSql: '',
    // timestamp_start: '',
    // timestamp_end: '',
    ...initialParams,
  })

  const queryParams = genQueryParams(params as any)
  const {
    data,
    error: swrError,
    isValidating: isLoading,
    mutate,
  } = useSWR<Logs>(
    params.sql ? `${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${queryParams}` : null,
    get,
    { revalidateOnFocus: false }
  )
  let error: null | string | object = swrError ? swrError.message : null

  if (!error && data?.error) {
    error = data?.error
  }
  const changeQuery = (newQuery = '') => {
    setParams((prev) => ({ ...prev, sql: cleanQuery(newQuery), rawSql: newQuery }))
  }

  return [
    { params, isLoading, logData: data?.result ? data?.result : [], error },
    { changeQuery, runQuery: () => mutate() },
  ]
}
export default useLogsQuery
