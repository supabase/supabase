import {
  genQueryParams,
  genSingleLogQuery,
  LogData,
  Logs,
  LogsEndpointParams,
  LOGS_TABLES,
  QueryType,
} from 'components/interfaces/Settings/Logs'
import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'
import { useQuery } from '@tanstack/react-query'

interface SingleLogHook {
  logData: LogData | undefined
  error: string | Object | null
  isLoading: boolean
  refresh: () => void
}
function useSingleLog(
  projectRef: string,
  queryType?: QueryType,
  paramsToMerge?: Partial<LogsEndpointParams>,
  id?: string | null
): SingleLogHook {
  const table = queryType ? LOGS_TABLES[queryType] : undefined
  const sql = id && table ? genSingleLogQuery(table, id) : ''
  const params: LogsEndpointParams = { ...paramsToMerge, project: projectRef, sql }
  const endpointUrl = `${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${genQueryParams(
    params as any
  )}`

  const enabled = Boolean(id && table)

  const {
    data,
    error: rcError,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery(
    ['projects', projectRef, 'log', id],
    ({ signal }) => get(endpointUrl, { signal }) as Promise<Logs>,
    {
      enabled,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )

  let error: null | string | object = rcError ? (rcError as any).message : null
  return {
    logData: data?.result ? data.result[0] : undefined,
    isLoading: (enabled && isLoading) || isRefetching,
    error,
    refresh: () => refetch(),
  }
}
export default useSingleLog
