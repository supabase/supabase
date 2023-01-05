import { DEFAULT_QUERY_PARAMS } from 'components/interfaces/Reports/Reports.constants'
import {
  BaseReportParams,
  DbQuery,
  DbQueryData,
  DbQueryHandler,
} from 'components/interfaces/Reports/Reports.types'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useExecuteSqlQuery } from 'data/sql/execute-sql-query'

const useLogsSqlQuery = (
  sql: DbQuery['sql'],
  params: BaseReportParams = DEFAULT_QUERY_PARAMS
): [DbQueryData, DbQueryHandler] => {
  const resolvedSql = typeof sql === 'function' ? sql(params) : sql

  // Generally we don't want to use contexts inside query hooks,
  // as keeping them as params makes them more reusable.
  // But in this case we're doing it this way to maintain compatibility with the old SWR hook.
  const { project } = useProjectContext()

  const {
    data,
    error: rqError,
    isLoading,
    isRefetching,
    refetch,
  } = useExecuteSqlQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      sql: resolvedSql,
    },
    {
      // enabled: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  )

  const error = rqError || (typeof data === 'object' ? data?.result.error : '')
  return [
    { error, data: data?.result, isLoading: isLoading || isRefetching, params },
    { runQuery: () => refetch() },
  ]
}

export default useLogsSqlQuery
