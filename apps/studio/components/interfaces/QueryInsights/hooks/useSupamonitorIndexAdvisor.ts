import { useQueries } from '@tanstack/react-query'

import { useIndexAdvisorStatus } from '../../QueryPerformance/hooks/useIsIndexAdvisorStatus'
import type { QueryPerformanceRow } from '../../QueryPerformance/QueryPerformance.types'
import { databaseKeys } from '@/data/database/keys'
import { getIndexAdvisorResult } from '@/data/database/retrieve-index-advisor-result-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

function isEligibleQuery(query: string): boolean {
  const lower = query.trim().toLowerCase()
  if (!lower.startsWith('select') && !lower.startsWith('with')) return false
  // Dollar-quoted string literals (e.g. $$...$$ or $tag$...$tag$) break the single-quoted
  // SQL embedding in getIndexAdvisorResult. Plain parameter markers ($1, $2, …) are fine.
  if (/\$([A-Za-z_][A-Za-z0-9_]*)?\$/.test(query)) return false
  return true
}

export function useSupamonitorIndexAdvisor(rows: QueryPerformanceRow[]): QueryPerformanceRow[] {
  const { data: project } = useSelectedProjectQuery()
  const { isIndexAdvisorEnabled } = useIndexAdvisorStatus()

  const eligibleQueries = rows.map((r) => r.query).filter(isEligibleQuery)

  const results = useQueries({
    queries: eligibleQueries.map((query) => ({
      queryKey: databaseKeys.indexAdvisorFromQuery(
        project?.ref,
        query,
        project?.connectionString ?? undefined
      ),
      queryFn: () =>
        getIndexAdvisorResult({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          query,
        }),
      enabled: isIndexAdvisorEnabled && !!project?.ref,
      retry: false,
      staleTime: Infinity,
    })),
  })

  if (!isIndexAdvisorEnabled) return rows

  const resultByQuery = new Map(
    eligibleQueries.map((query, i) => {
      const result = results[i]
      // Only treat as ready when status is definitively success or error.
      // undefined/pending means data hasn't arrived yet — store undefined so
      // classifyQuery can defer slow classification and avoid flicker.
      const isReady = result?.status === 'success' || result?.status === 'error'
      return [query, isReady ? (result.data ?? null) : undefined]
    })
  )

  return rows.map((row) => ({
    ...row,
    index_advisor_result: resultByQuery.has(row.query)
      ? resultByQuery.get(row.query)
      : (row.index_advisor_result ?? null),
  }))
}
