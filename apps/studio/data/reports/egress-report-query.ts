import { FeatureFlagContext, useFlag, useParams } from 'common'
import { useContext, useEffect, useState } from 'react'

import { PRESET_CONFIG } from '@/components/interfaces/Reports/Reports.constants'
import { getLogsSql, queriesFactory } from '@/components/interfaces/Reports/Reports.utils'
import type { LogsEndpointParams } from '@/components/interfaces/Settings/Logs/Logs.types'
import { IS_PLATFORM } from '@/lib/constants'

/**
 * Egress-focused report. Reuses existing API and Storage log queries to surface
 * what drives request volume by path, plus the cache hit/miss split.
 *
 * Note: API gateway logs do not yet include response byte data, so these tables
 * rank by request count, not GB. For GB totals by service, see the usage page.
 */
export const useEgressReport = () => {
  const { ref: projectRef } = useParams()
  const desiredUseOtel = useFlag('otelReports')
  const { hasLoaded: hasLoadedFlags } = useContext(FeatureFlagContext)
  const [appliedUseOtel, setAppliedUseOtel] = useState<boolean | null>(null)

  const hasAppliedQueryMode = appliedUseOtel !== null
  const useOtel = appliedUseOtel ?? false
  const resolvedProjectRef = IS_PLATFORM ? projectRef : (projectRef ?? 'default')
  const hasResolvedProjectRef = !IS_PLATFORM || projectRef !== undefined
  const areQueriesReady = hasAppliedQueryMode && hasResolvedProjectRef

  const apiQueryHooks = queriesFactory<keyof typeof PRESET_CONFIG.api.queries>(
    PRESET_CONFIG.api.queries,
    resolvedProjectRef,
    useOtel,
    areQueriesReady
  )
  const storageQueryHooks = queriesFactory<keyof typeof PRESET_CONFIG.storage.queries>(
    PRESET_CONFIG.storage.queries,
    resolvedProjectRef,
    useOtel,
    areQueriesReady
  )

  const topRoutes = apiQueryHooks.topRoutes()
  const cacheHitRate = storageQueryHooks.cacheHitRate()
  const topCacheMisses = storageQueryHooks.topCacheMisses()
  const activeHooks = [topRoutes, cacheHitRate, topCacheMisses]

  const handleRefresh = async () => {
    if (!areQueriesReady) return
    activeHooks.forEach((hook) => hook.runQuery())
  }
  const handleSetParams = (params: Partial<LogsEndpointParams>) => {
    activeHooks.forEach((hook) => {
      hook.setParams?.((prev: LogsEndpointParams) => ({ ...prev, ...params }))
    })
  }

  useEffect(() => {
    if (IS_PLATFORM && !hasLoadedFlags) return

    const nextUseOtel = IS_PLATFORM ? desiredUseOtel : false

    if (topRoutes.changeQuery) {
      topRoutes.changeQuery(getLogsSql(PRESET_CONFIG.api.queries.topRoutes, [], nextUseOtel))
    }
    if (cacheHitRate.changeQuery) {
      cacheHitRate.changeQuery(
        getLogsSql(PRESET_CONFIG.storage.queries.cacheHitRate, [], nextUseOtel)
      )
    }
    if (topCacheMisses.changeQuery) {
      topCacheMisses.changeQuery(
        getLogsSql(PRESET_CONFIG.storage.queries.topCacheMisses, [], nextUseOtel)
      )
    }
    setAppliedUseOtel(nextUseOtel)
    // Query hooks from queriesFactory are re-created each render; including them
    // would loop. Mirror the established report-hook pattern and omit them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desiredUseOtel, hasLoadedFlags])

  const isLoading = !areQueriesReady || activeHooks.some((hook) => hook.isLoading)

  return {
    data: {
      topRoutes: topRoutes.logData,
      cacheHitRate: cacheHitRate.logData,
      topCacheMisses: topCacheMisses.logData,
    },
    params: {
      topRoutes: topRoutes.params,
      cacheHitRate: cacheHitRate.params,
      topCacheMisses: topCacheMisses.params,
    },
    error: {
      topRoutes: topRoutes.error,
      cacheHitRate: cacheHitRate.error,
      topCacheMisses: topCacheMisses.error,
    },
    mergeParams: handleSetParams,
    isLoading,
    refresh: handleRefresh,
  }
}
