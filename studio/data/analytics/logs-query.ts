import {
  EXPLORER_DATEPICKER_HELPERS,
  genQueryParams,
  getDefaultHelper,
} from 'components/interfaces/Settings/Logs'
import { Dispatch, SetStateAction, useState } from 'react'
import { LogsEndpointParams, Logs, LogData } from 'components/interfaces/Settings/Logs/Logs.types'
import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'
import { useQuery } from '@tanstack/react-query'
import { analyticsKeys } from './keys'

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

// API differs from the other query hooks, as it maintains compatibility with the old SWR hook.
export const useLogsQuery = (
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
    error: rqError,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<Logs>(
    analyticsKeys.logs(projectRef, params),
    async ({ signal }) => {
      const response = await get(
        `${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${queryParams}`,
        {
          signal,
        }
      )

      if (response.error) {
        throw response.error
      }

      return response
    },
    {
      enabled: typeof projectRef !== 'undefined' && Boolean(params.sql),
      refetchOnWindowFocus: false,
    }
  )
  let error: null | string | object = rqError ? (rqError as any)?.message : null

  if (!error && data?.error) {
    error = data?.error
  }
  const changeQuery = (newQuery = '') => {
    setParams((prev) => ({ ...prev, sql: newQuery }))
  }

  return [
    {
      params,
      isLoading: isLoading || isRefetching,
      logData: data?.result ? data?.result : [],
      error,
    },
    { changeQuery, runQuery: () => refetch(), setParams },
  ]
}
