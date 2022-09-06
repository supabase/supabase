import {
  genQueryParams,
  genSingleLogQuery,
  LogData,
  Logs,
  LogsEndpointParams,
  LOGS_TABLES,
  QueryType,
} from 'components/interfaces/Settings/Logs'
import useSWR from 'swr'
import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'

interface Data {
  logData: LogData | undefined
  error: string | Object | null
  isLoading: boolean
}
interface Handlers {
  refresh: () => void
}
function useSingleLog(
  project: string,
  queryType?: QueryType,
  paramsToMerge?: Partial<LogsEndpointParams>,
  id?: string | null
): [Data, Handlers] {
  const table = queryType ? LOGS_TABLES[queryType] : undefined
  const sql = id && table ? genSingleLogQuery(table, id) : ''
  const params: LogsEndpointParams = { ...paramsToMerge, project, sql }
  const endpointUrl = `${API_URL}/projects/${project}/analytics/endpoints/logs.all?${genQueryParams(
    params as any
  )}`
  const {
    data,
    error: swrError,
    isValidating,
    mutate,
  } = useSWR<Logs>(id && table ? endpointUrl : null, get, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5000,
  })

  let error: null | string | object = swrError ? swrError.message : null
  return [
    {
      logData: data?.result ? data.result[0] : undefined,
      isLoading: isValidating,
      error,
    },
    {
      refresh: () => mutate(),
    },
  ]
}
export default useSingleLog
