import type { UseQueryResult } from '@tanstack/react-query'

import type {
  WarehouseMetricsData,
  WarehouseMetricsError,
} from '@/data/warehouse/warehouse-metrics-query'

export type WorkloadView =
  | { kind: 'loading' }
  | { kind: 'error'; error: WarehouseMetricsError }
  | { kind: 'unavailable'; isRefreshing: boolean }
  | { kind: 'ready'; data: WarehouseMetricsData; isRefreshing: boolean }

export function getWorkloadView(
  query: UseQueryResult<WarehouseMetricsData, WarehouseMetricsError>
): WorkloadView {
  if (query.isPending) return { kind: 'loading' }
  if (query.isError) return { kind: 'error', error: query.error }

  const isUnavailable =
    query.data.metrics.length > 0 &&
    query.data.metrics.every((metric) =>
      ['disabled', 'not_provisioned'].includes(metric.availability)
    )

  if (isUnavailable) return { kind: 'unavailable', isRefreshing: query.isFetching }

  return { kind: 'ready', data: query.data, isRefreshing: query.isFetching }
}

export function getWorkloadStatus(view: WorkloadView) {
  switch (view.kind) {
    case 'loading':
      return 'Loading workload metrics'
    case 'error':
      return 'Failed to load workload metrics'
    case 'unavailable':
      return view.isRefreshing ? 'Loading workload metrics' : 'Warehouse metrics are unavailable'
    case 'ready':
      return view.isRefreshing ? 'Loading workload metrics' : 'Workload metrics loaded'
  }
}
