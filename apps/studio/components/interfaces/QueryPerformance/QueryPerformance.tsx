import { useParams } from 'common'
import { useEffect } from 'react'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'

import { PresetHookResult } from '../Reports/Reports.utils'
import { QueryPerformanceInfiniteHook } from './useQueryPerformanceQuery'
import { WithStatements } from './WithStatements/WithStatements'

interface QueryPerformanceProps {
  queryHitRate: PresetHookResult
  queryPerformanceQuery: QueryPerformanceInfiniteHook
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
