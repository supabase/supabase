import { useMemo } from 'react'

import type { QueryPerformanceRow } from '../../QueryPerformance/QueryPerformance.types'

export const useQueryInsightsMetrics = (data: QueryPerformanceRow[]) => {
  const avgP95 = useMemo(() => {
    const rows = data.filter((r) => (r.p95_time ?? 0) > 0)
    if (rows.length === 0) return 0
    return Math.round(rows.reduce((sum, r) => sum + (r.p95_time ?? 0), 0) / rows.length)
  }, [data])

  const totalCalls = useMemo(() => data.reduce((sum, r) => sum + r.calls, 0), [data])

  const totalRowsRead = useMemo(() => data.reduce((sum, r) => sum + r.rows_read, 0), [data])

  const cacheHitRate = useMemo(() => {
    const hits = data.reduce((sum, r) => sum + (r._total_cache_hits ?? 0), 0)
    const misses = data.reduce((sum, r) => sum + (r._total_cache_misses ?? 0), 0)
    const total = hits + misses
    return total > 0 ? ((hits / total) * 100).toFixed(2) + '%' : '–'
  }, [data])

  return { avgP95, totalCalls, totalRowsRead, cacheHitRate }
}
