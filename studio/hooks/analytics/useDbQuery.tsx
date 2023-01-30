import { DEFAULT_QUERY_PARAMS } from 'components/interfaces/Reports/Reports.constants'
import {
  BaseReportParams,
  DbQueryData,
  DbQueryHandler,
  MetaQueryResponse,
  DbQuery,
} from 'components/interfaces/Reports/Reports.types'
import { useStore } from 'hooks'
import useSWR from 'swr'

type UseDbQuery = (sql: DbQuery['sql'], params?: BaseReportParams) => [DbQueryData, DbQueryHandler]
const useDbQuery: UseDbQuery = (sql, params = DEFAULT_QUERY_PARAMS) => {
  const { meta } = useStore()

  const resolvedSql = typeof sql === 'function' ? sql(params) : sql
  const {
    data,
    error: swrError,
    isValidating: isLoading,
    mutate,
  } = useSWR<MetaQueryResponse>(resolvedSql, async () => await meta.query(resolvedSql), {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
  })

  const error = swrError || (typeof data === 'object' ? data?.error : '')
  return [{ error, data, isLoading, params }, { runQuery: () => mutate() }]
}

export default useDbQuery
