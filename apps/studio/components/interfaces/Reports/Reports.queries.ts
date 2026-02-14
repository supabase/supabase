import useDbQuery from 'hooks/analytics/useDbQuery'
import { PRESET_CONFIG } from './Reports.constants'
import { Presets } from './Reports.types'

export type QueryPerformanceSort = {
  column:
    | 'query'
    | 'rolname'
    | 'total_time'
    | 'prop_total_time'
    | 'calls'
    | 'avg_rows'
    | 'max_time'
    | 'mean_time'
    | 'min_time'
  order: 'asc' | 'desc'
}

export type QueryPerformanceQueryOpts = {
  preset:
    | 'mostFrequentlyInvoked'
    | 'mostTimeConsuming'
    | 'slowestExecutionTime'
    | 'queryHitRate'
    | 'unified'
    | 'slowQueriesCount'
    | 'queryMetrics'
  searchQuery?: string
  orderBy?: QueryPerformanceSort
  roles?: string[]
  runIndexAdvisor?: boolean
  minCalls?: number
  minTotalTime?: number
  filterIndexAdvisor?: boolean
}

export const useQueryPerformanceQuery = ({
  preset,
  orderBy,
  searchQuery = '',
  roles,
  runIndexAdvisor = false,
  minCalls,
  minTotalTime,
  filterIndexAdvisor = false,
}: QueryPerformanceQueryOpts) => {
  const queryPerfQueries = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const baseSQL = queryPerfQueries.queries[preset]

  const whereSql = [
    roles !== undefined && roles.length > 0
      ? `auth.rolname in (${roles.map((r) => `'${r}'`).join(', ')})`
      : '',
    searchQuery.length > 0 ? `statements.query ~* '${searchQuery}'` : '',
    typeof minCalls === 'number' && minCalls > 0 ? `statements.calls >= ${minCalls}` : '',
    typeof minTotalTime === 'number' && minTotalTime > 0
      ? `(statements.total_exec_time + statements.total_plan_time) >= ${minTotalTime}`
      : '',
  ]
    .filter((x) => x.length > 0)
    .join(' AND ')

  const orderBySql = orderBy && `ORDER BY ${orderBy.column} ${orderBy.order}`
  const sql = baseSQL.sql(
    [],
    whereSql.length > 0 ? `WHERE ${whereSql}` : undefined,
    orderBySql,
    runIndexAdvisor,
    filterIndexAdvisor
  )
  return useDbQuery({
    sql,
    params: undefined,
    where: whereSql,
    orderBy: orderBySql,
  })
}
