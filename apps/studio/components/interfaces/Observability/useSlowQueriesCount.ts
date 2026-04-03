import { useMemo } from 'react'

import useDbQuery from '@/hooks/analytics/useDbQuery'

export function buildSlowQueriesCountSql(): string {
  return `
    -- observability-slow-queries-count
    set search_path to public, extensions;

    SELECT
      CASE
        WHEN EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
        )
        THEN (
          SELECT count(*)::int
          FROM pg_stat_statements
          WHERE total_exec_time + total_plan_time > 1000
        )
        ELSE 0
      END AS slow_queries_count;
  `
}

export const useSlowQueriesCount = (projectRef?: string, refreshKey: number = 0) => {
  // refreshKey is used in useMemo to force recomputation when refresh is triggered
  const sql = useMemo(
    () => buildSlowQueriesCountSql(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey]
  )

  const { data, isLoading, error } = useDbQuery({
    sql,
  })

  const slowQueriesCount = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return 0
    }
    return data[0]?.slow_queries_count ?? 0
  }, [data])

  return {
    slowQueriesCount,
    isLoading,
    error,
  }
}
