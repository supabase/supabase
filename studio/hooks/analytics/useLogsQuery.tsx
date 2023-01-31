import {
  EXPLORER_DATEPICKER_HELPERS,
  genQueryParams,
  getDefaultHelper,
} from 'components/interfaces/Settings/Logs'
import { Dispatch, SetStateAction, useState } from 'react'
import { LogsEndpointParams, Logs, LogData } from 'components/interfaces/Settings/Logs/Logs.types'
import { API_URL } from 'lib/constants'
import useSWR from 'swr'
import { get } from 'lib/common/fetch'
export interface LogsQueryData {
  params: LogsEndpointParams
  isLoading: boolean
  logData: LogData[]
  data?: never
  error: string | Object | null
}
export interface LogsQueryHandlers {
  changeQuery: (newQuery?: string) => void
  runQuery: () => void
  setParams: Dispatch<SetStateAction<LogsEndpointParams>>
}

const useLogsQuery = (
  projectRef: string,
  initialParams: Partial<LogsEndpointParams> = {}
): [LogsQueryData, LogsQueryHandlers] => {
  const defaultHelper = getDefaultHelper(EXPLORER_DATEPICKER_HELPERS)
  const [params, setParams] = useState<LogsEndpointParams>({
    sql: initialParams?.sql || '',
    project: projectRef,
    iso_timestamp_start: initialParams.iso_timestamp_start
      ? initialParams.iso_timestamp_start
      : defaultHelper.calcFrom(),
    iso_timestamp_end: initialParams.iso_timestamp_end
      ? initialParams.iso_timestamp_end
      : defaultHelper.calcTo(),
  })

  const queryParams = genQueryParams(params as any)
  const {
    data,
    error: swrError,
    isValidating: isLoading,
    mutate,
  } = useSWR<Logs>(
    params.sql
      ? `${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${queryParams}`
      : null,
    get,
    { revalidateOnFocus: false }
  )
  let error: null | string | object = swrError ? swrError.message : null

  if (!error && data?.error) {
    error = data?.error
  }
  const changeQuery = (newQuery = '') => {
    setParams((prev) => ({ ...prev, sql: newQuery }))
  }

  return [
    { params, isLoading, logData: data?.result ? data?.result : [], error },
    { changeQuery, runQuery: () => mutate(), setParams },
  ]
}
export default useLogsQuery
