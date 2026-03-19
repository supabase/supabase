import useDbQuery from 'hooks/analytics/useDbQuery'

import { PRESET_CONFIG } from '../Reports/Reports.constants'
import { Presets } from '../Reports/Reports.types'
import { QueryPerformanceSQLParams } from './QueryPerformance.types'

export function generateQueryPerformanceSql({
  preset,
  orderBy,
  searchQuery = '',
  roles = [],
  sources = [],
  minCalls = 0,
  minTotalTime = 0,
  runIndexAdvisor = false,
  filterIndexAdvisor = false,
}: QueryPerformanceSQLParams) {
  const queryPerfQueries = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const baseSQL = queryPerfQueries.queries[preset]

  const orderBySql = orderBy && `ORDER BY ${orderBy.column} ${orderBy.order}`

  const whereConditions = []
  if (roles.length > 0) {
    whereConditions.push(`auth.rolname in (${roles.map((r) => `'${r}'`).join(', ')})`)
  }
  if (searchQuery.length > 0) {
    whereConditions.push(`statements.query ~* '${searchQuery}'`)
  }
  if (sources.includes('dashboard') && !sources.includes('non-dashboard')) {
    whereConditions.push(`statements.query ~* 'source: dashboard'`)
  }
  if (sources.includes('non-dashboard') && !sources.includes('dashboard')) {
    whereConditions.push(`statements.query !~* 'source: dashboard'`)
  }
  if (minCalls > 0) {
    whereConditions.push(`statements.calls >= ${minCalls}`)
  }
  if (minTotalTime > 0) {
    whereConditions.push(
      `(statements.total_exec_time + statements.total_plan_time) >= ${minTotalTime}`
    )
  }

  const whereSql = whereConditions.join(' AND ')

  const sql = baseSQL.sql(
    [],
    whereSql.length > 0 ? `WHERE ${whereSql}` : undefined,
    orderBySql,
    runIndexAdvisor,
    filterIndexAdvisor
  )

  return { sql, whereSql, orderBySql }
}

export const useQueryPerformanceQuery = (props: QueryPerformanceSQLParams) => {
  const { sql, whereSql, orderBySql } = generateQueryPerformanceSql(props)
  return useDbQuery({ sql, params: undefined, where: whereSql, orderBy: orderBySql })
}
