import type { WarehouseMetricName, WarehouseMetricsInterval } from './warehouse-metrics-api-types'

export const warehouseKeys = {
  setupStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'warehouse', 'setup-status'] as const,
  catalog: (projectRef: string | undefined) =>
    ['projects', projectRef, 'warehouse', 'catalog'] as const,
  metricsAll: (projectRef: string | undefined) =>
    ['projects', projectRef, 'warehouse', 'metrics'] as const,
  metrics: (
    projectRef: string | undefined,
    params: {
      attributes: readonly WarehouseMetricName[]
      startDate: string
      endDate: string
      interval: WarehouseMetricsInterval
    }
  ) => [...warehouseKeys.metricsAll(projectRef), params] as const,
}
