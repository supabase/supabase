import { useMemo } from 'react'

import type { QueryPerformanceRow } from '../../QueryPerformance/QueryPerformance.types'
import type { ClassifiedQuery } from '../QueryInsightsHealth/QueryInsightsHealth.types'
import { getQueryType } from '../QueryInsightsTable/QueryInsightsTable.utils'
import { classifyQuery } from './useQueryInsightsIssues.utils'

export function useQueryInsightsIssues(data: QueryPerformanceRow[]) {
  return useMemo(() => {
    const classified: ClassifiedQuery[] = data.map((row) => {
      const { issueType, hint } = classifyQuery(row)
      return { ...row, issueType, hint, queryType: getQueryType(row.query) }
    })

    const errors = classified.filter((q) => q.issueType === 'error')
    const indexIssues = classified.filter((q) => q.issueType === 'index')
    const slowQueries = classified.filter((q) => q.issueType === 'slow')

    return { classified, errors, indexIssues, slowQueries }
  }, [data])
}
