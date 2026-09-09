import { useFlag, useParams } from 'common'
import isEqual from 'lodash/isEqual'
import { useState } from 'react'

import { PRESET_CONFIG } from '@/components/interfaces/Reports/Reports.constants'
import { ReportFilterItem } from '@/components/interfaces/Reports/Reports.types'
import { getLogsSql } from '@/components/interfaces/Reports/Reports.utils'
import {
  API_REPORT_QUERIES_OTEL,
  STORAGE_REPORT_QUERIES_OTEL,
} from '@/components/interfaces/Reports/Reports.utils.otel'
import type { LogsEndpointParams } from '@/components/interfaces/Settings/Logs/Logs.types'
import { useLogsQuery } from '@/hooks/analytics/useLogsQuery'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'

export const useStorageReport = (initialParams: Partial<LogsEndpointParams>) => {
  const { ref: projectRef } = useParams()
  const useOtel = useFlag('otelLegacyLogs')
  const [filters, setFilters] = useState<ReportFilterItem[]>([])
  const state = useDatabaseSelectorStateSnapshot()

  const identifier = state.selectedDatabaseId

  const formattedFilters: ReportFilterItem[] = [
    ...filters,
    ...(identifier !== undefined
      ? [{ key: 'identifier', value: identifier, compare: 'is' } as ReportFilterItem]
      : []),
  ]

  const totalRequests = useLogsQuery({
    projectRef,
    initialParams,
    sql: useOtel
      ? API_REPORT_QUERIES_OTEL.totalRequests.safeSql(formattedFilters)
      : getLogsSql(PRESET_CONFIG.api.queries.totalRequests, formattedFilters),
    options: { useOtel },
  })
  const topRoutes = useLogsQuery({
    projectRef,
    initialParams,
    sql: useOtel
      ? API_REPORT_QUERIES_OTEL.topRoutes.safeSql(formattedFilters)
      : getLogsSql(PRESET_CONFIG.api.queries.topRoutes, formattedFilters),
    options: { useOtel },
  })
  const errorCounts = useLogsQuery({
    projectRef,
    initialParams,
    sql: useOtel
      ? API_REPORT_QUERIES_OTEL.errorCounts.safeSql(formattedFilters)
      : getLogsSql(PRESET_CONFIG.api.queries.errorCounts, formattedFilters),
    options: { useOtel },
  })
  const topErrorRoutes = useLogsQuery({
    projectRef,
    initialParams,
    sql: useOtel
      ? API_REPORT_QUERIES_OTEL.topErrorRoutes.safeSql(formattedFilters)
      : getLogsSql(PRESET_CONFIG.api.queries.topErrorRoutes, formattedFilters),
    options: { useOtel },
  })
  const responseSpeed = useLogsQuery({
    projectRef,
    initialParams,
    sql: useOtel
      ? API_REPORT_QUERIES_OTEL.responseSpeed.safeSql(formattedFilters)
      : getLogsSql(PRESET_CONFIG.api.queries.responseSpeed, formattedFilters),
    options: { useOtel },
  })
  const topSlowRoutes = useLogsQuery({
    projectRef,
    initialParams,
    sql: useOtel
      ? API_REPORT_QUERIES_OTEL.topSlowRoutes.safeSql(formattedFilters)
      : getLogsSql(PRESET_CONFIG.api.queries.topSlowRoutes, formattedFilters),
    options: { useOtel },
  })
  const networkTraffic = useLogsQuery({
    projectRef,
    initialParams,
    sql: useOtel
      ? API_REPORT_QUERIES_OTEL.networkTraffic.safeSql(formattedFilters)
      : getLogsSql(PRESET_CONFIG.api.queries.networkTraffic, formattedFilters),
    options: { useOtel },
  })
  const cacheHitRate = useLogsQuery({
    projectRef,
    initialParams,
    sql: useOtel
      ? STORAGE_REPORT_QUERIES_OTEL.cacheHitRate.safeSql()
      : getLogsSql(PRESET_CONFIG.storage.queries.cacheHitRate, []),
    options: { useOtel },
  })
  const topCacheMisses = useLogsQuery({
    projectRef,
    initialParams,
    sql: useOtel
      ? STORAGE_REPORT_QUERIES_OTEL.topCacheMisses.safeSql()
      : getLogsSql(PRESET_CONFIG.storage.queries.topCacheMisses, []),
    options: { useOtel },
  })
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

  const isLoading = activeHooks.some((hook) => hook.isLoading)

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
      cacheHitRate: cacheHitRate.error,
      topCacheMisses: topCacheMisses.error,
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
