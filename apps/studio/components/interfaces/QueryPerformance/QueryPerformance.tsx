import { useEffect, useState } from 'react'

import { WithMonitor } from './WithMonitor/WithMonitor'
import { WithStatements } from './WithStatements/WithStatements'
import { useParams } from 'common'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { PresetHookResult } from '../Reports/Reports.utils'

interface QueryPerformanceProps {
  queryHitRate: PresetHookResult
  queryPerformanceQuery: DbQueryHook<any>
  queryMetrics: PresetHookResult
  isPgStatMonitorEnabled: boolean
  dateRange?: {
    period_start: { date: string; time_period: string }
    period_end: { date: string; time_period: string }
    interval: string
  }
  onDateRangeChange?: (from: string, to: string) => void
}

export const QueryPerformance = ({
  queryHitRate,
  queryPerformanceQuery,
  queryMetrics,
  isPgStatMonitorEnabled,
  dateRange,
  onDateRangeChange,
}: QueryPerformanceProps) => {
  const { ref } = useParams()
  const state = useDatabaseSelectorStateSnapshot()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    state.setSelectedDatabaseId(ref)
    setIsMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])

  if (!isMounted) return null

  if (isPgStatMonitorEnabled) {
    return <WithMonitor dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
  }

  return (
    <WithStatements
      queryHitRate={queryHitRate}
      queryPerformanceQuery={queryPerformanceQuery}
      queryMetrics={queryMetrics}
    />
  )
}
