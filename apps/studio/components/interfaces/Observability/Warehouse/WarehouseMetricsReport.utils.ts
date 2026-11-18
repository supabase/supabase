import type { WarehouseMetric } from '@/data/warehouse/warehouse-metrics-api-types'

export function getReportStatus({
  isPlatform,
  isLoading,
  hasSetupError,
  canShowSetup,
  isDisabled,
  hasMetricsError,
  hasChartValues,
  emptyMessage,
}: {
  isPlatform: boolean
  isLoading: boolean
  hasSetupError: boolean
  canShowSetup: boolean
  isDisabled: boolean
  hasMetricsError: boolean
  hasChartValues: boolean
  emptyMessage: string
}) {
  if (!isPlatform) return 'Warehouse metrics are unavailable'
  if (isLoading) return 'Loading Warehouse report'
  if (hasSetupError) return 'Could not load Warehouse setup status'
  if (canShowSetup) return isDisabled ? 'Warehouse is disabled' : 'Warehouse is not set up'
  if (hasMetricsError) return 'Could not load Warehouse metrics'
  return hasChartValues ? 'Warehouse report loaded' : `Warehouse report: ${emptyMessage}`
}

export function getEmptyMessage(metric?: WarehouseMetric) {
  if (!metric || metric.series.length > 1) return 'Metrics are temporarily unavailable'
  switch (metric.availability) {
    case 'stale':
      return 'No recent data'
    case 'insufficient_data':
      return 'Not enough data yet'
    case 'unavailable':
    case 'disabled':
    case 'not_provisioned':
      return 'Metrics are temporarily unavailable'
    default:
      return 'No data in the last 60 minutes'
  }
}
