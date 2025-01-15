import type { OrgMetricsUsage } from 'data/usage/org-usage-query'

export const getResourcesExceededLimitsOrg = (usageMetrics: OrgMetricsUsage[]): string[] => {
  if (!usageMetrics.length) return []

  return usageMetrics
    .filter((usageMetric) => {
      if (
        !usageMetric.capped ||
        !usageMetric.available_in_plan ||
        usageMetric.unlimited ||
        usageMetric.metric === 'DISK_IOPS_GP3'
      ) {
        return false
      }

      const freeUnits = usageMetric.pricing_free_units || 0

      return usageMetric.usage > freeUnits
    })
    .map((it) => it.metric)
}
