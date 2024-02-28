import { useProjectContentStore } from 'stores/projectContentStore'
import { PRESET_CONFIG } from './Reports.constants'
import { Presets } from './Reports.types'
import useDbQuery from 'hooks/analytics/useDbQuery'
import { useMutation, useQuery } from '@tanstack/react-query'

type QueryPerformanceQueryOpts = {
  searchQuery: string
  preset: 'mostFrequentlyInvoked' | 'mostTimeConsuming' | 'slowestExecutionTime' | 'queryHitRate'
  orderBy: string | 'lat_asc' | 'lat_desc'
}
export const useQueryPerformanceQuery = ({
  preset,
  orderBy,
  searchQuery,
}: QueryPerformanceQueryOpts) => {
  const queryPerfQueries = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const baseSQL = queryPerfQueries.queries[preset]

  if (orderBy !== 'lat_asc' && orderBy !== 'lat_desc') {
    // Default to lat_desc if not specified or invalid
    orderBy = 'lat_desc'
  }

  const whereSql = searchQuery
    ? `WHERE auth.rolname ~ '${searchQuery}' OR statements.query ~ '${searchQuery}'`
    : ''
  const orderBySql = orderBy === 'lat_asc' ? 'ORDER BY total_time asc' : 'ORDER BY total_time desc'

  const sql = baseSQL.sql([], whereSql, orderBySql)

  return useDbQuery(sql, undefined, whereSql, orderBySql)
}
