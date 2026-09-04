import { useFlag, useParams } from 'common'
import { useEffect } from 'react'

import { PRESET_CONFIG } from '@/components/interfaces/Reports/Reports.constants'
import { getLogsSql, queriesFactory } from '@/components/interfaces/Reports/Reports.utils'

export const useStorageCacheReport = () => {
  const { ref: projectRef } = useParams()
  const useOtel = useFlag('otelReports')

  const storageQueryHooks = queriesFactory<keyof typeof PRESET_CONFIG.storage.queries>(
    PRESET_CONFIG.storage.queries,
    projectRef ?? 'default',
    useOtel
  )
  const cacheHitRate = storageQueryHooks.cacheHitRate()
  const topCacheMisses = storageQueryHooks.topCacheMisses()
  const activeHooks = [cacheHitRate, topCacheMisses]

  useEffect(() => {
    cacheHitRate.changeQuery?.(getLogsSql(PRESET_CONFIG.storage.queries.cacheHitRate, [], useOtel))
    topCacheMisses.changeQuery?.(
      getLogsSql(PRESET_CONFIG.storage.queries.topCacheMisses, [], useOtel)
    )
  }, [useOtel])

  return {
    data: {
      cacheHitRate: cacheHitRate.logData,
      topCacheMisses: topCacheMisses.logData,
    },
    params: {
      cacheHitRate: cacheHitRate.params,
      topCacheMisses: topCacheMisses.params,
    },
    error: {
      cacheHitRate: cacheHitRate.error,
      topCacheMisses: topCacheMisses.error,
    },
    isLoading: activeHooks.some((hook) => hook.isLoading),
    mergeParams: (params: Partial<(typeof cacheHitRate)['params']>) => {
      activeHooks.forEach((hook) => hook.setParams?.((prev) => ({ ...prev, ...params })))
    },
    refresh: async () => {
      activeHooks.forEach((hook) => hook.runQuery())
    },
  }
}
