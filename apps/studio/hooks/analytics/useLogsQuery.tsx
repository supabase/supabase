import { useQuery } from '@tanstack/react-query'
import { Dispatch, SetStateAction, useState, useEffect } from 'react'

import { IS_PLATFORM } from 'common'
import {
  EXPLORER_DATEPICKER_HELPERS,
  getDefaultHelper,
} from 'components/interfaces/Settings/Logs/Logs.constants'
import type {
  LogData,
  Logs,
  LogsEndpointParams,
} from 'components/interfaces/Settings/Logs/Logs.types'
import {
  checkForILIKEClause,
  checkForWithClause,
} from 'components/interfaces/Settings/Logs/Logs.utils'
import { get } from 'data/fetchers'
import { useLogsUrlState } from 'hooks/analytics/useLogsUrlState'

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
  const { timestampStart, timestampEnd } = useLogsUrlState()
  const defaultHelper = getDefaultHelper(EXPLORER_DATEPICKER_HELPERS)
  const [params, setParams] = useState<LogsEndpointParams>({
    sql: initialParams?.sql || '',
    project: projectRef,
    iso_timestamp_start: timestampStart || initialParams.iso_timestamp_start || '',
    iso_timestamp_end: timestampEnd || initialParams.iso_timestamp_end || '',
  })

  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      ...initialParams,
      project: projectRef,
      sql: initialParams?.sql ?? prev.sql,
      iso_timestamp_start: timestampStart || initialParams.iso_timestamp_start || '',
      iso_timestamp_end: timestampEnd || initialParams.iso_timestamp_end || '',
    }))
  }, [projectRef, initialParams.sql, timestampStart, timestampEnd])

  const _enabled = enabled && typeof projectRef !== 'undefined' && Boolean(params.sql)

  const usesWith = checkForWithClause(params.sql || '')
  const usesILIKE = checkForILIKEClause(params.sql || '')

  const {
    data,
    error: rqError,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery(
    ['projects', projectRef, 'logs', params],
    async ({ signal }) => {
      const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: projectRef },
          query: params,
        },
        signal,
      })
      if (error) {
        throw error
      }

      return data as unknown as Logs
    },
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
    logData: data?.result ?? [],
    error,
    changeQuery,
    runQuery: () => refetch(),
    setParams,
  }
}
export default useLogsQuery
