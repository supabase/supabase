import { useQueries } from '@tanstack/react-query'

import { databaseKeys } from 'data/database/keys'
import { getIndexAdvisorResult } from 'data/database/retrieve-index-advisor-result-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIndexAdvisorStatus } from '../../QueryPerformance/hooks/useIsIndexAdvisorStatus'
import type { QueryPerformanceRow } from '../../QueryPerformance/QueryPerformance.types'

function isEligibleQuery(query: string): boolean {
  const lower = query.trim().toLowerCase()
  return lower.startsWith('select') || lower.startsWith('with')
}

export function useSupamonitorIndexAdvisor(rows: QueryPerformanceRow[]): QueryPerformanceRow[] {
  const { data: project } = useSelectedProjectQuery()
  const { isIndexAdvisorEnabled } = useIndexAdvisorStatus()

  const eligibleQueries = rows.map((r) => r.query).filter(isEligibleQuery)

  const results = useQueries({
    queries: eligibleQueries.map((query) => ({
      queryKey: databaseKeys.indexAdvisorFromQuery(project?.ref, query),
      queryFn: () =>
        getIndexAdvisorResult({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          query,
        }),
      enabled: isIndexAdvisorEnabled && !!project?.ref,
      retry: false,
    })),
  })

  if (!isIndexAdvisorEnabled) return rows

  const resultByQuery = new Map(
    eligibleQueries.map((query, i) => [query, results[i]?.data ?? null])
  )

  return rows.map((row) => ({
    ...row,
    index_advisor_result: resultByQuery.has(row.query)
      ? resultByQuery.get(row.query) ?? null
      : row.index_advisor_result ?? null,
  }))
}
