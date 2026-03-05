import { QueryPerformanceRow } from '../QueryPerformance.types'
import {
  filterProtectedSchemaIndexAdvisorResult,
  queryInvolvesProtectedSchemas,
} from '../IndexAdvisor/index-advisor.utils'

export const transformStatementDataToRows = (
  data: any[],
  filterIndexAdvisor: boolean = false
): QueryPerformanceRow[] => {
  if (!data || data.length === 0) return []

  const totalTimeAcrossAllQueries = data.reduce((sum, row) => sum + (row.total_time || 0), 0)

  return data
    .map((row) => {
      const filteredIndexAdvisorResult = row.index_advisor_result
        ? filterProtectedSchemaIndexAdvisorResult(row.index_advisor_result)
        : null

      return {
        query: row.query,
        rolname: row.rolname || undefined,
        calls: row.calls || 0,
        mean_time: row.mean_time || 0,
        min_time: row.min_time || 0,
        max_time: row.max_time || 0,
        total_time: row.total_time || 0,
        rows_read: row.rows_read || 0,
        cache_hit_rate: row.cache_hit_rate || 0,
        prop_total_time:
          totalTimeAcrossAllQueries > 0 ? (row.total_time / totalTimeAcrossAllQueries) * 100 : 0,
        index_advisor_result: filteredIndexAdvisorResult,
      }
    })
    .filter((row) => {
      if (filterIndexAdvisor) {
        const hasValidRecommendations = row.index_advisor_result !== null
        const involvesProtectedSchemas = queryInvolvesProtectedSchemas(row.query)

        if (involvesProtectedSchemas && !hasValidRecommendations) {
          return false
        }
      }
      return true
    })
}
