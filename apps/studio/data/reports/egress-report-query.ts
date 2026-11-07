import { FeatureFlagContext, useFlag, useParams } from 'common'
import { useContext, useEffect, useState } from 'react'

import { PRESET_CONFIG } from '@/components/interfaces/Reports/Reports.constants'
import { getLogsSql, queriesFactory } from '@/components/interfaces/Reports/Reports.utils'
import type { LogsEndpointParams } from '@/components/interfaces/Settings/Logs/Logs.types'
import { IS_PLATFORM } from '@/lib/constants'

/**
 * Endpoint-level egress breakdown. Ranks REST API paths by request count for a
 * single project. Reuses the existing API log query infra, so it adds no new
 * query machinery. Runs only when a caller mounts it (the breakdown is collapsed
 * by default), scoped to the passed project ref.
 */
export const useEgressReport = (projectRefOverride?: string) => {
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

  const queryHooks = queriesFactory<keyof typeof PRESET_CONFIG.api.queries>(
    PRESET_CONFIG.api.queries,
    resolvedProjectRef,
    useOtel,
    areQueriesReady
  )
  const topPaths = queryHooks.egressTopPaths()

  const handleRefresh = async () => {
    if (!areQueriesReady) return
    topPaths.runQuery()
  }
  const handleSetParams = (params: Partial<LogsEndpointParams>) => {
    topPaths.setParams?.((prev: LogsEndpointParams) => ({ ...prev, ...params }))
  }

  useEffect(() => {
    if (IS_PLATFORM && !hasLoadedFlags) return
    const nextUseOtel = IS_PLATFORM ? desiredUseOtel : false
    if (topPaths.changeQuery) {
      topPaths.changeQuery(getLogsSql(PRESET_CONFIG.api.queries.egressTopPaths, [], nextUseOtel))
    }
    setAppliedUseOtel(nextUseOtel)
    // Query hooks from queriesFactory are re-created each render; including them
    // would loop. Mirror the established report-hook pattern and omit them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desiredUseOtel, hasLoadedFlags])

  return {
    data: { topPaths: topPaths.logData },
    params: { topPaths: topPaths.params },
    error: { topPaths: topPaths.error },
    isLoading: !areQueriesReady || topPaths.isLoading,
    refresh: handleRefresh,
    mergeParams: handleSetParams,
  }
}
