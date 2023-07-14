import { useQuery } from '@tanstack/react-query'
import {
  EXPLORER_DATEPICKER_HELPERS,
  genQueryParams,
  getDefaultHelper,
} from 'components/interfaces/Settings/Logs'
import { Dispatch, SetStateAction, useState } from 'react'
import { LogsEndpointParams, Logs, LogData } from 'components/interfaces/Settings/Logs/Logs.types'
import { API_URL } from 'lib/constants'
import { get, isResponseOk } from 'lib/common/fetch'
export interface LogsQueryHook {
  params: LogsEndpointParams
  isLoading: boolean
  logData: LogData[]
  data?: never
  error: string | Object | null
  changeQuery: (newQuery?: string) => void
  runQuery: () => void
  setParams: Dispatch<SetStateAction<LogsEndpointParams>>
}

const useLogsQuery = (
  projectRef: string,
  initialParams: Partial<LogsEndpointParams> = {}
): LogsQueryHook => {
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

  const enabled = typeof projectRef !== 'undefined' && Boolean(params.sql)

  const queryParams = genQueryParams(params as any)
  const {
    data,
    error: rqError,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery(
    ['projects', projectRef, 'logs', queryParams],
    ({ signal }) =>
      get<Logs>(`${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${queryParams}`, {
        signal,
      }),
    {
      enabled,
      refetchOnWindowFocus: false,
    }
  )

  let error: null | string | object = rqError ? (rqError as any).message : null

  if (!error && data?.error) {
    error = data?.error
  }
  const changeQuery = (newQuery = '') => {
    setParams((prev) => ({ ...prev, sql: newQuery }))
  }

  return {
    params,
    isLoading: (enabled && isLoading) || isRefetching,
    logData: isResponseOk(data) && data.result ? data.result : [],
    error,
    changeQuery,
    runQuery: () => refetch(),
    setParams,
  }
}
export default useLogsQuery
