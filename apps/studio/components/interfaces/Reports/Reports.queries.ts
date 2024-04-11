import { PRESET_CONFIG } from './Reports.constants'
import { Presets } from './Reports.types'
import useDbQuery from 'hooks/analytics/useDbQuery'

export type QueryPerformanceSort = {
  column:
    | 'total_time'
    | 'prop_total_time'
    | 'calls'
    | 'avg_rows'
    | 'max_time'
    | 'mean_time'
    | 'min_time'
  order: 'asc' | 'desc'
}

type QueryPerformanceQueryOpts = {
  preset: 'mostFrequentlyInvoked' | 'mostTimeConsuming' | 'slowestExecutionTime' | 'queryHitRate'
  searchQuery?: string
  orderBy?: QueryPerformanceSort
  roles?: string[]
}

export const useQueryPerformanceQuery = ({
  preset,
  orderBy = { column: 'total_time', order: 'desc' },
  searchQuery = '',
  roles,
}: QueryPerformanceQueryOpts) => {
  const queryPerfQueries = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const baseSQL = queryPerfQueries.queries[preset]

  const whereSql = [
    roles !== undefined && roles.length > 0
      ? `WHERE auth.rolname in (${roles.map((r) => `'${r}'`).join(', ')})`
      : '',
    searchQuery.length > 0 ? `statements.query ~ '${searchQuery}'` : '',
  ]
    .filter((x) => x.length > 0)
    .join(' OR ')

  // [Joshen] TODO: Support ordering on more columns
  // calls, total_time, prop_total_time, avg_rows, max_time, mean_time, min_time
  // const orderBySql = orderBy === 'lat_asc' ? 'ORDER BY total_time asc' : 'ORDER BY total_time desc'
  const orderBySql = `ORDER BY ${orderBy.column} ${orderBy.order}`

  const sql = baseSQL.sql([], whereSql, orderBySql)

  return useDbQuery(sql, undefined, whereSql, orderBySql)
}
