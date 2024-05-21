import { useQuery } from '@tanstack/react-query'
import { DEFAULT_QUERY_PARAMS } from 'components/interfaces/Reports/Reports.constants'
import {
  BaseReportParams,
  MetaQueryResponse,
  ReportQuery,
} from 'components/interfaces/Reports/Reports.types'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'

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

// [Joshen] Atm this is being used only in query performance
const useDbQuery = ({
  sql,
  params = DEFAULT_QUERY_PARAMS,
  where,
  orderBy,
}: {
  sql: ReportQuery['sql'] | string
  params?: BaseReportParams
  where?: string
  orderBy?: string
}): DbQueryHook => {
  const { project } = useProjectContext()
  const state = useDatabaseSelectorStateSnapshot()

  const { data: databases } = useReadReplicasQuery({ projectRef: project?.ref })
  const connectionString = project?.is_read_replicas_enabled
    ? (databases || []).find((db) => db.identifier === state.selectedDatabaseId)?.connectionString
    : project?.connectionString
  const identifier = project?.is_read_replicas_enabled ? state.selectedDatabaseId : project?.ref

  const resolvedSql = typeof sql === 'function' ? sql([]) : sql

  const {
    data,
    error: rqError,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery(
    ['projects', project?.ref, 'db', { ...params, sql: resolvedSql, identifier }, where, orderBy],
    ({ signal }) => {
      return executeSql(
        {
          projectRef: project?.ref,
          connectionString: connectionString || project?.connectionString,
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
