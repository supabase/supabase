import { useEffect } from 'react'

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

  useEffect(() => {
    state.setSelectedDatabaseId(ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])

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
