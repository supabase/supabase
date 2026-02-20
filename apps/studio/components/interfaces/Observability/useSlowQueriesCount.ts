import useDbQuery from 'hooks/analytics/useDbQuery'
import { useMemo } from 'react'

export const useSlowQueriesCount = (projectRef?: string, refreshKey: number = 0) => {
  // SQL to count queries with total execution time > 1000ms (1 second)
  // refreshKey is used in useMemo to force recomputation when refresh is triggered
  const sql = useMemo(
    () => `
    -- observability-slow-queries-count
    set search_path to public, extensions;

    SELECT
      count(*)::int as slow_queries_count
    FROM pg_stat_statements
    WHERE total_exec_time + total_plan_time > 1000;
  `,
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
