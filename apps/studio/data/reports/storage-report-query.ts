import { useEffect } from 'react'

import { useParams } from 'common'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import type { LogsEndpointParams } from 'components/interfaces/Settings/Logs/Logs.types'
import type { Organization } from '../../types'
import type { Project } from '../projects/project-detail-query'
import { numberFormatter } from '../../components/ui/Charts/Charts.utils'
import { formatBytes } from '../../lib/helpers'

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
