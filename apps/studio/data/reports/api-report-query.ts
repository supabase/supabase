import { isEqual } from 'lodash'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import { ReportFilterItem } from 'components/interfaces/Reports/Reports.types'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import { LogsEndpointParams } from 'components/interfaces/Settings/Logs'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'

export const useApiReport = () => {
  const { project } = useProjectContext()
  const { ref: projectRef } = useParams()
  const state = useDatabaseSelectorStateSnapshot()

  // [Joshen] TODO: Once API support is out
  const showReadReplicasUI = false // project?.is_read_replicas_enabled

  const queryHooks = queriesFactory<keyof typeof PRESET_CONFIG.api.queries>(
    PRESET_CONFIG.api.queries,
    projectRef ?? 'default'
  )
  const totalRequests = queryHooks.totalRequests()
  const topRoutes = queryHooks.topRoutes()
  const errorCounts = queryHooks.errorCounts()
  const topErrorRoutes = queryHooks.topErrorRoutes()
  const responseSpeed = queryHooks.responseSpeed()
  const topSlowRoutes = queryHooks.topSlowRoutes()
  const networkTraffic = queryHooks.networkTraffic()
  const activeHooks = [
    totalRequests,
    topRoutes,
    errorCounts,
    topErrorRoutes,
    responseSpeed,
    topSlowRoutes,
    networkTraffic,
  ]
  const [filters, setFilters] = useState<ReportFilterItem[]>([])
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

  useEffect(() => {
    // update sql for each query
    if (totalRequests.changeQuery) {
      totalRequests.changeQuery(PRESET_CONFIG.api.queries.totalRequests.sql(filters))
    }
    if (topRoutes.changeQuery) {
      topRoutes.changeQuery(PRESET_CONFIG.api.queries.topRoutes.sql(filters))
    }
    if (errorCounts.changeQuery) {
      errorCounts.changeQuery(PRESET_CONFIG.api.queries.errorCounts.sql(filters))
    }

    if (topErrorRoutes.changeQuery) {
      topErrorRoutes.changeQuery(PRESET_CONFIG.api.queries.topErrorRoutes.sql(filters))
    }
    if (responseSpeed.changeQuery) {
      responseSpeed.changeQuery(PRESET_CONFIG.api.queries.responseSpeed.sql(filters))
    }

    if (topSlowRoutes.changeQuery) {
      topSlowRoutes.changeQuery(PRESET_CONFIG.api.queries.topSlowRoutes.sql(filters))
    }

    if (networkTraffic.changeQuery) {
      networkTraffic.changeQuery(PRESET_CONFIG.api.queries.networkTraffic.sql(filters))
    }
  }, [JSON.stringify(filters)])

  const handleRefresh = async () => {
    activeHooks.forEach((hook) => hook.runQuery())
  }
  const handleSetParams = (params: Partial<LogsEndpointParams>) => {
    activeHooks.forEach((hook) => {
      hook.setParams?.((prev: LogsEndpointParams) => ({ ...prev, ...params }))
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
    },
    params: {
      totalRequests: totalRequests.params,
      errorCounts: errorCounts.params,
      responseSpeed: responseSpeed.params,
      topRoutes: topRoutes.params,
      topErrorRoutes: topErrorRoutes.params,
      topSlowRoutes: topSlowRoutes.params,
      networkTraffic: networkTraffic.params,
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
