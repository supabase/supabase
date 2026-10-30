import { FeatureFlagContext, useFlag, useParams } from 'common'
import isEqual from 'lodash/isEqual'
import { useContext, useEffect, useState } from 'react'

import { PRESET_CONFIG } from '@/components/interfaces/Reports/Reports.constants'
import { ReportFilterItem } from '@/components/interfaces/Reports/Reports.types'
import { getLogsSql, queriesFactory } from '@/components/interfaces/Reports/Reports.utils'
import type { LogsEndpointParams } from '@/components/interfaces/Settings/Logs/Logs.types'
import { IS_PLATFORM } from '@/lib/constants'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'

export const useStorageReport = () => {
  const { ref: projectRef } = useParams()
  const [filters, setFilters] = useState<ReportFilterItem[]>([])
  const state = useDatabaseSelectorStateSnapshot()
  const desiredUseOtel = useFlag('otelReports')
  const { hasLoaded: hasLoadedFlags } = useContext(FeatureFlagContext)
  const [appliedUseOtel, setAppliedUseOtel] = useState<boolean | null>(null)

  const identifier = state.selectedDatabaseId
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
  const storageQueryHooks = queriesFactory<keyof typeof PRESET_CONFIG.storage.queries>(
    PRESET_CONFIG.storage.queries,
    resolvedProjectRef,
    useOtel,
    areQueriesReady
  )
  const totalRequests = queryHooks.totalRequests()
  const topRoutes = queryHooks.topRoutes()
  const errorCounts = queryHooks.errorCounts()
  const topErrorRoutes = queryHooks.topErrorRoutes()
  const responseSpeed = queryHooks.responseSpeed()
  const topSlowRoutes = queryHooks.topSlowRoutes()
  const networkTraffic = queryHooks.networkTraffic()
  const cacheHitRate = storageQueryHooks.cacheHitRate()
  const topCacheMisses = storageQueryHooks.topCacheMisses()
  const activeHooks = [
    totalRequests,
    topRoutes,
    errorCounts,
    topErrorRoutes,
    responseSpeed,
    topSlowRoutes,
    networkTraffic,
    cacheHitRate,
    topCacheMisses,
  ]

  const handleRefresh = async () => {
    if (!areQueriesReady) return
    activeHooks.forEach((hook) => hook.runQuery())
  }
  const handleSetParams = (params: Partial<LogsEndpointParams>) => {
    activeHooks.forEach((hook) => {
      hook.setParams?.((prev: LogsEndpointParams) => ({ ...prev, ...params }))
    })
  }

  const addFilter = (filter: ReportFilterItem) => {
    // use a deep equal when comparing objects.
    if (filters.some((f) => isEqual(f, filter))) return
    setFilters((prev) =>
      [...prev, filter].sort((a, b) => {
        const keyA = a.key.toLowerCase()
        const keyB = b.key.toLowerCase()
        if (keyA < keyB) {
          return -1
        }
        if (keyA > keyB) {
          return 1
        }
        return 0
      })
    )
  }
  const removeFilter = (filter: ReportFilterItem) => removeFilters([filter])
  const removeFilters = (toRemove: ReportFilterItem[]) => {
    setFilters((prev) => {
      return prev.filter((f) => !toRemove.find((r) => isEqual(f, r)))
    })
  }

  const formattedFilters: ReportFilterItem[] = [
    ...filters,
    ...(identifier !== undefined
      ? [{ key: 'identifier', value: identifier, compare: 'is' } as ReportFilterItem]
      : []),
  ]

  useEffect(() => {
    if (IS_PLATFORM && !hasLoadedFlags) return

    const nextUseOtel = IS_PLATFORM ? desiredUseOtel : false

    if (totalRequests.changeQuery) {
      totalRequests.changeQuery(
        getLogsSql(PRESET_CONFIG.api.queries.totalRequests, formattedFilters, nextUseOtel)
      )
    }
    if (topRoutes.changeQuery) {
      topRoutes.changeQuery(
        getLogsSql(PRESET_CONFIG.api.queries.topRoutes, formattedFilters, nextUseOtel)
      )
    }
    if (errorCounts.changeQuery) {
      errorCounts.changeQuery(
        getLogsSql(PRESET_CONFIG.api.queries.errorCounts, formattedFilters, nextUseOtel)
      )
    }

    if (topErrorRoutes.changeQuery) {
      topErrorRoutes.changeQuery(
        getLogsSql(PRESET_CONFIG.api.queries.topErrorRoutes, formattedFilters, nextUseOtel)
      )
    }
    if (responseSpeed.changeQuery) {
      responseSpeed.changeQuery(
        getLogsSql(PRESET_CONFIG.api.queries.responseSpeed, formattedFilters, nextUseOtel)
      )
    }

    if (topSlowRoutes.changeQuery) {
      topSlowRoutes.changeQuery(
        getLogsSql(PRESET_CONFIG.api.queries.topSlowRoutes, formattedFilters, nextUseOtel)
      )
    }

    if (networkTraffic.changeQuery) {
      networkTraffic.changeQuery(
        getLogsSql(PRESET_CONFIG.api.queries.networkTraffic, formattedFilters, nextUseOtel)
      )
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
  }, [JSON.stringify(formattedFilters), desiredUseOtel, hasLoadedFlags])

  const isLoading = !areQueriesReady || activeHooks.some((hook) => hook.isLoading)

  return {
    data: {
      totalRequests: totalRequests.logData,
      errorCounts: errorCounts.logData,
      responseSpeed: responseSpeed.logData,
      topRoutes: topRoutes.logData,
      topErrorRoutes: topErrorRoutes.logData,
      topSlowRoutes: topSlowRoutes.logData,
      networkTraffic: networkTraffic.logData,
      cacheHitRate: cacheHitRate.logData,
      topCacheMisses: topCacheMisses.logData,
    },
    params: {
      totalRequests: totalRequests.params,
      errorCounts: errorCounts.params,
      responseSpeed: responseSpeed.params,
      topRoutes: topRoutes.params,
      topErrorRoutes: topErrorRoutes.params,
      topSlowRoutes: topSlowRoutes.params,
      networkTraffic: networkTraffic.params,
      cacheHitRate: cacheHitRate.params,
      topCacheMisses: topCacheMisses.params,
    },
    error: {
      totalRequest: totalRequests.error,
      errorCounts: errorCounts.error,
      responseSpeed: responseSpeed.error,
      topRoutes: topRoutes.error,
      topErrorRoute: topErrorRoutes.error,
      topSlowRoutes: topSlowRoutes.error,
      networkTraffic: networkTraffic.error,
    },
    mergeParams: handleSetParams,
    filters,
    addFilter,
    removeFilter,
    removeFilters,
    isLoading,
    refresh: handleRefresh,
  }
}
