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
      // Filter out protected schema recommendations from index_advisor_result
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
      // If warnings filter is on, exclude rows that:
      // 1. Only have protected schema recommendations (filteredIndexAdvisorResult is null)
      // 2. Or involve protected schemas and have no valid recommendations
      if (filterIndexAdvisor) {
        const hasValidRecommendations = row.index_advisor_result !== null
        const involvesProtectedSchemas = queryInvolvesProtectedSchemas(row.query)

        // Exclude if it involves protected schemas and has no valid recommendations
        if (involvesProtectedSchemas && !hasValidRecommendations) {
          return false
        }
      }
      return true
    })
}
