import type { WarehouseMetric } from '@/data/warehouse/warehouse-metrics-api-types'

type ErrorLike = { message: string }

export type SetupPrompt = 'not_started' | 'disabled'

export type ReportView =
  | { kind: 'unsupported' }
  | { kind: 'loading' }
  | { kind: 'out-of-range' }
  | { kind: 'setup-error'; error: ErrorLike }
  | { kind: 'setup'; prompt: SetupPrompt }
  | { kind: 'metrics-error'; error: ErrorLike }
  | { kind: 'ready'; hasChartValues: boolean }

const isValidValue = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined && Number.isFinite(value)

export function hasAnyValues(metric?: WarehouseMetric) {
  return (
    metric?.series.some((series) => series.points.some((point) => isValidValue(point.value))) ??
    false
  )
}

// Only a single series is charted; multiple series are treated as unavailable.
export function toChartPoints(metric?: WarehouseMetric): Record<string, string | number>[] {
  if (metric?.series.length !== 1) return []
  return metric.series[0].points.map((point) => {
    const row: Record<string, string | number> = {
      timestamp: new Date(point.timestamp * 1000).toISOString(),
    }
    if (isValidValue(point.value)) row.value = point.value
    return row
  })
}

export function getSetupPrompt({
  setupStatus,
  hasLiveTables,
  hasValues,
}: {
  setupStatus?: string
  hasLiveTables: boolean
  hasValues: boolean
}): SetupPrompt | undefined {
  if (hasValues || hasLiveTables) return undefined
  if (setupStatus === 'disabled') return 'disabled'
  if (setupStatus === 'not_started') return 'not_started'
  return undefined
}

// Order matters: the first matching state wins.
export function getReportView({
  isPlatform,
  isRangeValid = true,
  isLoading,
  setupError,
  setupPrompt,
  metricsError,
  hasChartValues,
}: {
  isPlatform: boolean
  isRangeValid?: boolean
  isLoading: boolean
  setupError: ErrorLike | null
  setupPrompt: SetupPrompt | undefined
  metricsError: ErrorLike | null
  hasChartValues: boolean
}): ReportView {
  if (!isPlatform) return { kind: 'unsupported' }
  if (!isRangeValid) return { kind: 'out-of-range' }
  if (isLoading) return { kind: 'loading' }
  if (setupError) return { kind: 'setup-error', error: setupError }
  if (setupPrompt) return { kind: 'setup', prompt: setupPrompt }
  if (metricsError) return { kind: 'metrics-error', error: metricsError }
  return { kind: 'ready', hasChartValues }
}

export function getReportStatus(view: ReportView, emptyMessage: string) {
  switch (view.kind) {
    case 'unsupported':
      return 'Warehouse metrics are unavailable'
    case 'out-of-range':
      return 'This period is outside the available metrics history'
    case 'loading':
      return 'Loading Warehouse report'
    case 'setup-error':
      return 'Could not load Warehouse setup status'
    case 'setup':
      return view.prompt === 'disabled' ? 'Warehouse is disabled' : 'Warehouse is not set up'
    case 'metrics-error':
      return 'Could not load Warehouse metrics'
    case 'ready':
      return view.hasChartValues ? 'Warehouse report loaded' : `Warehouse report: ${emptyMessage}`
  }
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
      return 'No data in the selected period'
  }
}
