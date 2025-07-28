import { useQuery } from '@tanstack/react-query'
import { LOGS_TABLES } from 'components/interfaces/Settings/Logs/Logs.constants'
import type {
  LogData,
  Logs,
  LogsEndpointParams,
  QueryType,
} from 'components/interfaces/Settings/Logs/Logs.types'
import { genSingleLogQuery } from 'components/interfaces/Settings/Logs/Logs.utils'
import { get } from 'data/fetchers'

interface SingleLogHook {
  data: LogData | undefined
  error: string | Object | null
  isLoading: boolean
  refresh: () => void
}

type SingleLogParams = {
  id?: string
  projectRef: string
  queryType?: QueryType
  paramsToMerge?: Partial<LogsEndpointParams>
}
function useSingleLog({
  projectRef,
  id,
  queryType,
  paramsToMerge,
}: SingleLogParams): SingleLogHook {
  const table = queryType ? LOGS_TABLES[queryType] : undefined
  const sql = id && table ? genSingleLogQuery(table, id) : ''

  const params: LogsEndpointParams = { ...paramsToMerge, sql }

  const enabled = Boolean(id && table)

  const {
    data,
    error: rcError,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery(
    ['projects', projectRef, 'single-log', id, queryType],
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
      enabled,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )

  let error: null | string | object = rcError ? (rcError as any).message : null
  const result = data?.result ? data.result[0] : undefined
  return {
    data: result,
    isLoading: (enabled && isLoading) || isRefetching,
    error,
    refresh: () => refetch(),
  }
}
export default useSingleLog
