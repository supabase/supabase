import { useMemo } from 'react'

import { QUERY_HIT_RATE_SQL } from '@/components/interfaces/Reports/Reports.constants'
import useDbQuery from '@/hooks/analytics/useDbQuery'

type HitRateRow = {
  name: string
  ratio: number | null
}

export type HitRates = {
  tableHitRate: number | null
  indexHitRate: number | null
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

export const useHitRates = () => {
  const { data, isLoading, error } = useDbQuery({ sql: QUERY_HIT_RATE_SQL })

  const hitRates = useMemo(() => parseHitRates(data), [data])

  return {
    ...hitRates,
    isLoading,
    error,
  }
}
