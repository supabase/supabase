import { useEffect, useState } from 'react'
import isEqual from 'lodash/isEqual'

import { useParams } from 'common'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import { ReportFilterItem } from 'components/interfaces/Reports/Reports.types'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { formatBytes } from 'lib/helpers'

import type { LogsEndpointParams } from 'components/interfaces/Settings/Logs/Logs.types'
import type { Project } from '../projects/project-detail-query'
import type { Organization } from 'types'

export const useStorageReport = () => {
  const { ref: projectRef } = useParams()
  const [filters, setFilters] = useState<ReportFilterItem[]>([])
  const state = useDatabaseSelectorStateSnapshot()

  const identifier = state.selectedDatabaseId

  const queryHooks = queriesFactory<keyof typeof PRESET_CONFIG.storage.queries>(
    PRESET_CONFIG.storage.queries,
    projectRef ?? 'default'
  )
  const totalRequests = queryHooks.totalRequests()
  const topRoutes = queryHooks.topRoutes()
  const errorCounts = queryHooks.errorCounts()
  const topErrorRoutes = queryHooks.topErrorRoutes()
  const responseSpeed = queryHooks.responseSpeed()
  const topSlowRoutes = queryHooks.topSlowRoutes()
  const networkTraffic = queryHooks.networkTraffic()
  const cacheHitRate = queryHooks.cacheHitRate()
  const topCacheMisses = queryHooks.topCacheMisses()
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

  const formattedFilters: ReportFilterItem[] = [
    ...filters,
    ...(identifier !== undefined
      ? [{ key: 'identifier', value: `'${identifier}'`, compare: 'is' } as ReportFilterItem]
      : []),
  ]

  useEffect(() => {
    if (totalRequests.changeQuery) {
      totalRequests.changeQuery(PRESET_CONFIG.api.queries.totalRequests.sql(formattedFilters))
    }
    if (topRoutes.changeQuery) {
      topRoutes.changeQuery(PRESET_CONFIG.api.queries.topRoutes.sql(formattedFilters))
    }
    if (errorCounts.changeQuery) {
      errorCounts.changeQuery(PRESET_CONFIG.api.queries.errorCounts.sql(formattedFilters))
    }

    if (topErrorRoutes.changeQuery) {
      topErrorRoutes.changeQuery(PRESET_CONFIG.api.queries.topErrorRoutes.sql(formattedFilters))
    }
    if (responseSpeed.changeQuery) {
      responseSpeed.changeQuery(PRESET_CONFIG.api.queries.responseSpeed.sql(formattedFilters))
    }

    if (topSlowRoutes.changeQuery) {
      topSlowRoutes.changeQuery(PRESET_CONFIG.api.queries.topSlowRoutes.sql(formattedFilters))
    }

    if (networkTraffic.changeQuery) {
      networkTraffic.changeQuery(PRESET_CONFIG.api.queries.networkTraffic.sql(formattedFilters))
    }

    if (cacheHitRate.changeQuery) {
      cacheHitRate.changeQuery(PRESET_CONFIG.storage.queries.cacheHitRate.sql([]))
    }

    if (topCacheMisses.changeQuery) {
      topCacheMisses.changeQuery(PRESET_CONFIG.storage.queries.topCacheMisses.sql([]))
    }
  }, [JSON.stringify(formattedFilters)])

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

export const getStorageReportAttributes = (org: Organization, project: Project) => {
  const isFreePlan = org?.plan?.id === 'free'
  const computeSize = project?.infra_compute_size || 'medium'
  const isSpendCapEnabled =
    org?.plan.id !== 'free' && !org?.usage_billing_enabled && project?.cloud_provider !== 'FLY'

  return [
    {
      id: 'storage-usage',
      label: 'Storage Usage',
      hide: false,
      showTooltip: true,
      showLegend: true,
      hideChartType: false,
      defaultChartStyle: 'line',
      showMaxValue: true,
      showGrid: true,
      syncId: 'storage-reports',
      valuePrecision: 2,
      YAxisProps: {
        width: 60,
        tickFormatter: (value: any) => formatBytes(value, 2),
      },
      attributes: [
        {
          attribute: 'node_filesystem_avail_bytes',
          provider: 'infra-monitoring',
          label: 'Available',
          tooltip: '',
        },
        {
          attribute: 'node_filesystem_free_bytes',
          provider: 'infra-monitoring',
          label: 'Free',
          tooltip: '',
        },
        {
          attribute: 'node_filesystem_size_bytes',
          provider: 'infra-monitoring',
          label: 'Max',
          isMaxValue: true,
          tooltip: '',
        },
      ],
    },
  ]
}
