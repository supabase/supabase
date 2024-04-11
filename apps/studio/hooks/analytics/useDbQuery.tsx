import { useQuery } from '@tanstack/react-query'
import { DEFAULT_QUERY_PARAMS } from 'components/interfaces/Reports/Reports.constants'
import {
  BaseReportParams,
  MetaQueryResponse,
  ReportQuery,
} from 'components/interfaces/Reports/Reports.types'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { executeSql } from 'data/sql/execute-sql-query'

export interface DbQueryHook<T = any> {
  isLoading: boolean
  isRefetching: boolean
  error: string
  data: T[]
  params: BaseReportParams
  logData?: never
  runQuery: () => void
  setParams?: never
  changeQuery?: never
  resolvedSql: string
}

const useDbQuery = (
  sql: ReportQuery['sql'] | string,
  params: BaseReportParams = DEFAULT_QUERY_PARAMS,
  where?: string,
  orderBy?: string
): DbQueryHook => {
  const { project } = useProjectContext()

  const resolvedSql = typeof sql === 'function' ? sql([]) : sql

  const {
    data,
    error: rqError,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery(
    ['projects', project?.ref, 'db', { ...params, sql: resolvedSql }, where, orderBy],
    ({ signal }) => {
      return executeSql(
        {
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          sql: resolvedSql,
        },
        signal
      ).then((res) => res.result) as Promise<MetaQueryResponse>
    },
    {
      enabled: Boolean(resolvedSql),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  )

  const error = rqError || (typeof data === 'object' ? data?.error : '')
  return {
    error,
    data,
    isLoading,
    isRefetching,
    params,
    runQuery: refetch,
    resolvedSql,
  }
}

export default useDbQuery
