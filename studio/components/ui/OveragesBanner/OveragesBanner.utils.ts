import { compact } from 'lodash'
import { USAGE_APPROACHING_THRESHOLD } from 'lib/constants'
import { OrgUsageResponse, UsageMetric } from 'data/usage/org-usage-query'

export const getResourcesApproachingLimits = (usages: any) => {
  if (!usages) return []

  return compact(
    Object.keys(usages)
      .filter((resourceName) => usages[resourceName] !== null)
      .map((resourceName) => {
        const resource = usages[resourceName]
        if (resource.usage / resource.limit >= USAGE_APPROACHING_THRESHOLD) return resourceName
      })
  )
}

export const getResourcesExceededLimits = (usages: any) => {
  if (!usages) return []

  return compact(
    Object.keys(usages)
      .filter((resourceName) => usages[resourceName] !== null)
      .map((resourceName) => {
        const resource = usages[resourceName]
        if (resource.limit > 0 && resource.usage / resource.limit > 1) return resourceName
      })
  )
}

export const getResourcesExceededLimitsOrg = (usageMetrics: UsageMetric[]): string[] => {
  if (!usageMetrics.length) return []

  return usageMetrics
    .filter((usageMetric) => {
      if (!usageMetric.capped || !usageMetric.available_in_plan || usageMetric.unlimited)
        return false

      const freeUnits = usageMetric.pricing_free_units || 0

      return usageMetric.usage > freeUnits
    })
    .map((it) => it.metric)
}
