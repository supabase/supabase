import dayjs from 'dayjs'

import type {
  WarehouseMetric,
  WarehouseMetricAvailability,
  WarehouseMetricName,
  WarehouseMetricsResponse,
} from '@/data/warehouse/warehouse-metrics-api-types'

export const WAREHOUSE_SUMMARY_ATTRIBUTES: readonly WarehouseMetricName[] = [
  'query_rate',
  'query_duration_p95',
  'query_error_rate',
  'worker_admission_occupied',
  'worker_admission_limit',
]

export const getWarehouseSummaryRange = () => {
  const end = dayjs().startOf('minute')
  return { startDate: end.subtract(1, 'hour').toISOString(), endDate: end.toISOString() }
}

export type WarehouseSummaryValue = {
  availability: WarehouseMetricAvailability
  value: number | null
  timestamp: number | null
}

export const getWarehouseSummaryValue = (
  response: WarehouseMetricsResponse,
  name: WarehouseMetricName
): WarehouseSummaryValue => {
  const metric = response.metrics.find((item) => item.metric === name)
  const empty = {
    availability: metric?.availability ?? 'unavailable',
    value: null,
    timestamp: null,
  }
  if (!metric || !['ok', 'partial'].includes(metric.availability)) return empty
  if (metric.series.length !== 1) return empty

  const latest = metric.series[0].points.reduce<
    WarehouseMetric['series'][number]['points'][number] | undefined
  >(
    (previous, point) => (!previous || point.timestamp > previous.timestamp ? point : previous),
    undefined
  )
  if (!latest || latest.value === null || !Number.isFinite(latest.value)) return empty

  return { availability: metric.availability, value: latest.value, timestamp: latest.timestamp }
}

export const getWarehouseSummaryNotice = ({ availability, value }: WarehouseSummaryValue) => {
  switch (availability) {
    case 'partial':
      return 'Partial data'
    case 'stale':
      return 'No recent data'
    case 'insufficient_data':
      return 'Not enough samples'
    case 'no_data':
      return 'No samples in this period'
    case 'disabled':
      return 'Warehouse metrics are unavailable'
    case 'not_provisioned':
      return 'Warehouse metrics are unavailable'
    case 'unavailable':
      return 'Metric unavailable'
    default:
      return value === null ? 'No value at the latest interval' : undefined
  }
}

export const getWarehouseErrorPercentage = (
  errors: WarehouseSummaryValue,
  rate: WarehouseSummaryValue
): WarehouseSummaryValue => ({
  ...errors,
  availability:
    errors.availability === 'partial' || rate.availability === 'partial'
      ? 'partial'
      : errors.availability,
  value:
    errors.value !== null &&
    rate.value !== null &&
    rate.value > 0 &&
    errors.timestamp === rate.timestamp
      ? (errors.value / rate.value) * 100
      : null,
})

export type WarehouseSummaryPoint = { timestamp: string } & Record<string, string | number>

export const getWarehouseSummaryPoints = (
  response: WarehouseMetricsResponse,
  name: WarehouseMetricName,
  scale = 1
) => {
  const metric = response.metrics.find((item) => item.metric === name)
  if (!metric || !['ok', 'partial'].includes(metric.availability) || metric.series.length !== 1) {
    return []
  }
  return metric.series[0].points.map((point): WarehouseSummaryPoint => {
    const row: WarehouseSummaryPoint = { timestamp: new Date(point.timestamp * 1000).toISOString() }
    if (point.value !== null && Number.isFinite(point.value)) row.value = point.value * scale
    return row
  })
}
