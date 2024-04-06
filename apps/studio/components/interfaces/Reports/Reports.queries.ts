import { PRESET_CONFIG } from './Reports.constants'
import { Presets } from './Reports.types'
import useDbQuery from 'hooks/analytics/useDbQuery'

type QueryPerformanceQueryOpts = {
  searchQuery: string
  preset: 'mostFrequentlyInvoked' | 'mostTimeConsuming' | 'slowestExecutionTime' | 'queryHitRate'
  orderBy: string | 'lat_asc' | 'lat_desc'
  roles?: string[]
}
export const useQueryPerformanceQuery = ({
  preset,
  orderBy,
  searchQuery,
  roles,
}: QueryPerformanceQueryOpts) => {
  const queryPerfQueries = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const baseSQL = queryPerfQueries.queries[preset]

  if (orderBy !== 'lat_asc' && orderBy !== 'lat_desc') {
    // Default to lat_desc if not specified or invalid
    orderBy = 'lat_desc'
  }

  const whereSql = [
    roles !== undefined && roles.length > 0
      ? `WHERE auth.rolname in (${roles.map((r) => `'${r}'`).join(', ')})`
      : '',
    searchQuery.length > 0 ? `statements.query ~ '${searchQuery}'` : '',
  ]
    .filter((x) => x.length > 0)
    .join(' OR ')

  const orderBySql = orderBy === 'lat_asc' ? 'ORDER BY total_time asc' : 'ORDER BY total_time desc'

  const sql = baseSQL.sql([], whereSql, orderBySql)

  return useDbQuery(sql, undefined, whereSql, orderBySql)
}
