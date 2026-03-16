import { useEffect } from 'react'

import { WithStatements } from './WithStatements/WithStatements'
import { useParams } from 'common'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { PresetHookResult } from '../Reports/Reports.utils'

interface QueryPerformanceProps {
  queryHitRate: PresetHookResult
  queryPerformanceQuery: DbQueryHook<any>
  queryMetrics: PresetHookResult
}

export const QueryPerformance = ({
  queryHitRate,
  queryPerformanceQuery,
  queryMetrics,
}: QueryPerformanceProps) => {
  const { ref } = useParams()
  const state = useDatabaseSelectorStateSnapshot()

  useEffect(() => {
    state.setSelectedDatabaseId(ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])

  return (
    <WithStatements
      queryHitRate={queryHitRate}
      queryPerformanceQuery={queryPerformanceQuery}
      queryMetrics={queryMetrics}
    />
  )
}
