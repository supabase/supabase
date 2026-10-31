import { hasIndexRecommendations } from '../../QueryPerformance/IndexAdvisor/index-advisor.utils'
import type { QueryPerformanceRow } from '../../QueryPerformance/QueryPerformance.types'
import { SLOW_QUERY_THRESHOLD_MS } from '../QueryInsightsHealth/QueryInsightsHealth.constants'
import type { IssueType } from '../QueryInsightsHealth/QueryInsightsHealth.types'

export function classifyQuery(row: QueryPerformanceRow): { issueType: IssueType; hint: string } {
  // undefined means index advisor is still loading — defer index classification only to avoid
  // flickering between 'slow' and 'index' as results arrive, but still classify slow queries
  if (row.index_advisor_result === undefined) {
    if (row.mean_time > SLOW_QUERY_THRESHOLD_MS) {
      return { issueType: 'slow', hint: 'Abnormally slow query detected' }
    }
    return { issueType: null, hint: '' }
  }

  const advisorErrors = row.index_advisor_result?.errors
  if (advisorErrors && advisorErrors.length > 0) {
    return { issueType: 'error', hint: advisorErrors[0] }
  }

  if (hasIndexRecommendations(row.index_advisor_result, true)) {
    const statements = row.index_advisor_result?.index_statements ?? []
    return {
      issueType: 'index',
      hint: `Missing index: ${statements[0] ?? 'Index suggestion available'}`,
    }
  }

  if (row.mean_time > SLOW_QUERY_THRESHOLD_MS) {
    return {
      issueType: 'slow',
      hint: `Abnormally slow query detected`,
    }
  }

  return { issueType: null, hint: '' }
}
