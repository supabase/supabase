import { FeatureFlagContext, useFlag, useParams } from 'common'
import { useContext, useEffect, useState } from 'react'

import { PRESET_CONFIG } from '@/components/interfaces/Reports/Reports.constants'
import { getLogsSql, queriesFactory } from '@/components/interfaces/Reports/Reports.utils'
import type { LogsEndpointParams } from '@/components/interfaces/Settings/Logs/Logs.types'
import { IS_PLATFORM } from '@/lib/constants'

/**
 * Storage egress drill-down. Ranks Storage object paths by request count for a
 * single project, so a user can see which objects drive egress. Reuses the
 * existing Storage log query infra; runs only when a caller mounts it.
 */
export const useEgressStorageReport = (projectRefOverride?: string) => {
  const { ref } = useParams()
  const projectRef = projectRefOverride ?? ref
  const desiredUseOtel = useFlag('otelReports')
  const { hasLoaded: hasLoadedFlags } = useContext(FeatureFlagContext)
  const [appliedUseOtel, setAppliedUseOtel] = useState<boolean | null>(null)

  const hasAppliedQueryMode = appliedUseOtel !== null
  const useOtel = appliedUseOtel ?? false
  const resolvedProjectRef = IS_PLATFORM ? projectRef : (projectRef ?? 'default')
  const hasResolvedProjectRef = !IS_PLATFORM || projectRef !== undefined
  const areQueriesReady = hasAppliedQueryMode && hasResolvedProjectRef

  const queryHooks = queriesFactory<keyof typeof PRESET_CONFIG.storage.queries>(
    PRESET_CONFIG.storage.queries,
    resolvedProjectRef,
    useOtel,
    areQueriesReady
  )
  const topStoragePaths = queryHooks.egressTopStoragePaths()

  const handleRefresh = async () => {
    if (!areQueriesReady) return
    topStoragePaths.runQuery()
  }
  const handleSetParams = (params: Partial<LogsEndpointParams>) => {
    topStoragePaths.setParams?.((prev: LogsEndpointParams) => ({ ...prev, ...params }))
  }

  useEffect(() => {
    if (IS_PLATFORM && !hasLoadedFlags) return
    const nextUseOtel = IS_PLATFORM ? desiredUseOtel : false
    if (topStoragePaths.changeQuery) {
      topStoragePaths.changeQuery(
        getLogsSql(PRESET_CONFIG.storage.queries.egressTopStoragePaths, [], nextUseOtel)
      )
    }
    setAppliedUseOtel(nextUseOtel)
    // Query hooks from queriesFactory are re-created each render; including them
    // would loop. Mirror the established report-hook pattern and omit them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desiredUseOtel, hasLoadedFlags])

  return {
    data: { topStoragePaths: topStoragePaths.logData },
    params: { topStoragePaths: topStoragePaths.params },
    error: { topStoragePaths: topStoragePaths.error },
    isLoading: !areQueriesReady || topStoragePaths.isLoading,
    refresh: handleRefresh,
    mergeParams: handleSetParams,
  }
}
