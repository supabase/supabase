import { safeSql, type SafeSqlFragment } from '@supabase/pg-meta'
import { useMemo } from 'react'

import useDbQuery from '@/hooks/analytics/useDbQuery'

type HitRateRow = {
  name: string
  ratio: number | null
}

export type HitRates = {
  tableHitRate: number | null
  indexHitRate: number | null
}

/**
 * Builds the SQL to fetch table and index hit rates from
 * pg_statio_user_tables and pg_statio_user_indexes.
 *
 * Returns ratios as 0–1 decimals (multiply by 100 for percentage display).
 * Returns null when there is no data (e.g. no user tables yet).
 */
export function buildHitRatesSql(): SafeSqlFragment {
  return safeSql`
    -- observability-hit-rates
    select
      'index hit rate' as name,
      (sum(idx_blks_hit)) / nullif(sum(idx_blks_hit + idx_blks_read), 0) as ratio
    from pg_statio_user_indexes
    union all
    select
      'table hit rate' as name,
      sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) as ratio
    from pg_statio_user_tables;
  `
}

export function parseHitRates(data: unknown): HitRates {
  if (!Array.isArray(data)) {
    return { tableHitRate: null, indexHitRate: null }
  }

  let tableHitRate: number | null = null
  let indexHitRate: number | null = null

  for (const row of data as HitRateRow[]) {
    const ratio = row.ratio != null ? parseFloat(String(row.ratio)) : null
    const value = ratio != null && !isNaN(ratio) ? ratio * 100 : null

    if (row.name === 'table hit rate') {
      tableHitRate = value
    } else if (row.name === 'index hit rate') {
      indexHitRate = value
    }
  }

  return { tableHitRate, indexHitRate }
}

export const useHitRates = (refreshKey: number = 0) => {
  // refreshKey is included in useMemo to force recomputation when refresh is triggered
  const sql = useMemo(
    () => buildHitRatesSql(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey]
  )

  const { data, isLoading, error } = useDbQuery({ sql })

  const hitRates = useMemo(() => parseHitRates(data), [data])

  return {
    ...hitRates,
    isLoading,
    error,
  }
}
