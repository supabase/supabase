import { PRESET_CONFIG } from './Reports.constants'
import { Presets } from './Reports.types'
import useDbQuery from 'hooks/analytics/useDbQuery'

type QueryPerformanceQueryOpts = {
  preset: 'mostFrequentlyInvoked' | 'mostTimeConsuming' | 'slowestExecutionTime' | 'queryHitRate'
  searchQuery?: string
  orderBy?: string | 'lat_asc' | 'lat_desc'
  roles?: string[]
}
export const useQueryPerformanceQuery = ({
  preset,
  orderBy = 'lat_desc',
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

  const orderBySql = orderBy === 'lat_asc' ? 'ORDER BY total_time asc' : 'ORDER BY total_time desc'

  const sql = baseSQL.sql([], whereSql, orderBySql)

  return useDbQuery(sql, undefined, whereSql, orderBySql)
}
