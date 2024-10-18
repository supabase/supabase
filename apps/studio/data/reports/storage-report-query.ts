import { useEffect } from 'react'

import { useParams } from 'common'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import type { LogsEndpointParams } from 'components/interfaces/Settings/Logs/Logs.types'

export const useStorageReport = () => {
  const { ref: projectRef } = useParams()

  const queryHooks = queriesFactory<keyof typeof PRESET_CONFIG.storage.queries>(
    PRESET_CONFIG.storage.queries,
    projectRef ?? 'default'
  )
  const cacheHitRate = queryHooks.cacheHitRate()
  const topCacheMisses = queryHooks.topCacheMisses()
  const activeHooks = [cacheHitRate, topCacheMisses]

  const handleRefresh = async () => {
    activeHooks.forEach((hook) => hook.runQuery())
  }
  const handleSetParams = (params: Partial<LogsEndpointParams>) => {
    activeHooks.forEach((hook) => {
      hook.setParams?.((prev: LogsEndpointParams) => ({ ...prev, ...params }))
    })
  }

  useEffect(() => {
    if (cacheHitRate.changeQuery) {
      cacheHitRate.changeQuery(PRESET_CONFIG.storage.queries.cacheHitRate.sql([]))
    }

    if (topCacheMisses.changeQuery) {
      topCacheMisses.changeQuery(PRESET_CONFIG.storage.queries.topCacheMisses.sql([]))
    }
  }, [])

  const isLoading = activeHooks.some((hook) => hook.isLoading)

  return {
    data: {
      cacheHitRate: cacheHitRate.logData,
      topCacheMisses: topCacheMisses.logData,
    },
    params: {
      cacheHitRate: cacheHitRate.params,
      topCacheMisses: topCacheMisses.params,
    },
    mergeParams: handleSetParams,
    isLoading,
    refresh: handleRefresh,
  }
}
