import { DEFAULT_QUERY_PARAMS } from 'components/interfaces/Reports/Reports.constants'
import { BaseReportParams, PresetSql } from 'components/interfaces/Reports/Reports.types'
import { useStore } from 'hooks'
import useSWR from 'swr'
import { ResponseError } from 'types'

type QueryResponse = any | { error: ResponseError }
export interface DbQueryData<T = unknown[]> {
  data: T
  params?: never
  logData?: never
  isLoading: boolean
  error: string
}
export interface DbQueryHandler {
  runQuery: () => void
  setParams?: never
  changeQuery?: never
}
type UseDbQuery<T = unknown[]> = (sql: PresetSql, params?: BaseReportParams) => [DbQueryData<T>, DbQueryHandler]
const useDbQuery: UseDbQuery = (sql, params = DEFAULT_QUERY_PARAMS) => {
  const { meta } = useStore()

  const resolvedSql = typeof sql === 'function' ? sql(params) : sql

  const {
    data,
    error: swrError,
    isValidating: isLoading,
    mutate,
  } = useSWR<QueryResponse>(resolvedSql, meta.query, { revalidateOnFocus: false })

  const error = swrError || data?.error
  return [{ error, data, isLoading }, { runQuery: () => mutate() }]
}

export default useDbQuery
