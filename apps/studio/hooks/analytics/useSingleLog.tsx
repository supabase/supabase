import { useQuery } from '@tanstack/react-query'
import { LOGS_TABLES, genQueryParams } from 'components/interfaces/Settings/Logs/Logs.constants'
import type {
  LogData,
  Logs,
  LogsEndpointParams,
  QueryType,
} from 'components/interfaces/Settings/Logs/Logs.types'
import { genSingleLogQuery } from 'components/interfaces/Settings/Logs/Logs.utils'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

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

  const isWarehouseQuery = queryType === 'warehouse'
  // Warehouse queries are handled differently
  const enabled = Boolean(id && table && !isWarehouseQuery)

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
