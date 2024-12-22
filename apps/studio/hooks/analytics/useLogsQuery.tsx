import { useQuery } from '@tanstack/react-query'
import { Dispatch, SetStateAction, useState } from 'react'

import {
  EXPLORER_DATEPICKER_HELPERS,
  genQueryParams,
  getDefaultHelper,
} from 'components/interfaces/Settings/Logs/Logs.constants'
import type {
  LogData,
  Logs,
  LogsEndpointParams,
} from 'components/interfaces/Settings/Logs/Logs.types'
import { get, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import {
  checkForILIKEClause,
  checkForWildcard,
  checkForWithClause,
} from 'components/interfaces/Settings/Logs/Logs.utils'
import { IS_PLATFORM } from 'common'

export interface LogsQueryHook {
  params: LogsEndpointParams
  isLoading: boolean
  logData: LogData[]
  data?: never
  error: string | Object | null
  changeQuery: (newQuery?: string) => void
  runQuery: () => void
  setParams: Dispatch<SetStateAction<LogsEndpointParams>>
  enabled?: boolean
}

const useLogsQuery = (
  projectRef: string,
  initialParams: Partial<LogsEndpointParams> = {},
  enabled = true
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

  const _enabled = enabled && typeof projectRef !== 'undefined' && Boolean(params.sql)

  const queryParams = genQueryParams(params as any)

  const usesWith = checkForWithClause(params.sql || '')
  const usesILIKE = checkForILIKEClause(params.sql || '')

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
      enabled: _enabled,
      refetchOnWindowFocus: false,
    }
  )

  let error: null | string | object = rqError ? (rqError as any).message : null

  if (!error && data?.error) {
    error = data?.error
  }

  if (IS_PLATFORM) {
    if (usesWith) {
      error = {
        message: 'The parser does not yet support WITH and subquery statements.',
        docs: 'https://supabase.com/docs/guides/platform/advanced-log-filtering#the-with-keyword-and-subqueries-are-not-supported',
      }
    }
    if (usesILIKE) {
      error = {
        message: 'BigQuery does not support ILIKE. Use REGEXP_CONTAINS instead.',
        docs: 'https://supabase.com/docs/guides/platform/advanced-log-filtering#the-ilike-and-similar-to-keywords-are-not-supported',
      }
    }
  }
  const changeQuery = (newQuery = '') => {
    setParams((prev) => ({ ...prev, sql: newQuery }))
  }

  return {
    params,
    isLoading: (_enabled && isLoading) || isRefetching,
    logData: isResponseOk(data) && data.result ? data.result : [],
    error,
    changeQuery,
    runQuery: () => refetch(),
    setParams,
  }
}
export default useLogsQuery
