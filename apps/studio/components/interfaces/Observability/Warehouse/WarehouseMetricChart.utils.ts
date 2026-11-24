import type { WarehouseMetric } from '@/data/warehouse/warehouse-metrics-api-types'
import { formatBytes } from '@/lib/helpers'

export type WarehouseChartSeries = { metric?: WarehouseMetric; label: string }

const getLabelKey = (labels: Record<string, string>) =>
  Object.keys(labels)
    .sort()
    .map((key) => `${key}=${labels[key]}`)
    .join('|')

export type WarehouseSeriesLabelPart = { key: string; text: string }
export type WarehouseSeriesLabelFormatter = (
  labels: Record<string, string>
) => WarehouseSeriesLabelPart[]
export type WarehouseSeriesLabelOptions = {
  /** Defaults to the raw label values sorted by key. */
  formatLabels?: WarehouseSeriesLabelFormatter
  /** Drops label parts that every labelled series shares. */
  hideSharedLabels?: boolean
}

const formatRawLabels: WarehouseSeriesLabelFormatter = (labels) =>
  Object.keys(labels)
    .sort()
    .map((key) => ({ key, text: labels[key] }))

const humanize = (value: string) => {
  const text = value.replaceAll('_', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const WORKER_PATH_LABELS: Record<string, string> = {
  'apply:cdc': 'Live changes',
  'table_sync:copy': 'Initial copy',
  'table_sync:cdc': 'Initial copy catch-up',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  copy: 'Initial copy',
  insert: 'Inserts',
  update: 'Updates',
  delete: 'Deletes',
}

const OPERATION_LABELS: Record<string, string> = {
  cleanup_old_files: 'Clean up old files',
}

const REASON_LABELS: Record<string, string> = {
  pending_inlined_data_bytes_threshold: 'Inlined data threshold',
  active_data_files_threshold: 'Data file threshold',
  deleted_row_ratio_threshold: 'Deleted row threshold',
  snapshot_retention_threshold: 'Snapshot retention',
}

const RESULT_LABELS: Record<string, string> = {
  noop: 'Nothing to flush',
}

const ETL_PART_ORDER = [
  'worker_path',
  'event_type',
  'trigger',
  'operation',
  'reason',
  'outcome',
  'result',
  'table',
]

const getEtlPart = (key: string, value: string): WarehouseSeriesLabelPart => {
  switch (key) {
    case 'event_type':
      return { key, text: EVENT_TYPE_LABELS[value] ?? humanize(value) }
    case 'operation':
      return { key, text: OPERATION_LABELS[value] ?? humanize(value) }
    case 'reason':
      return { key, text: REASON_LABELS[value] ?? humanize(value) }
    case 'result':
      return { key, text: RESULT_LABELS[value] ?? humanize(value) }
    case 'table':
      return { key, text: value }
    case 'pipeline_id':
      return { key, text: `Pipeline ${value}` }
    default:
      return { key, text: humanize(value) }
  }
}

export const formatWarehouseEtlLabels: WarehouseSeriesLabelFormatter = (labels) => {
  const { worker_type: workerType, replication_path: replicationPath, ...rest } = labels
  const parts: WarehouseSeriesLabelPart[] = Object.keys(rest).map((key) =>
    getEtlPart(key, rest[key])
  )
  if (workerType !== undefined || replicationPath !== undefined) {
    const known =
      workerType !== undefined && replicationPath !== undefined
        ? WORKER_PATH_LABELS[`${workerType}:${replicationPath}`]
        : undefined
    const text =
      known ??
      [workerType, replicationPath]
        .filter((value): value is string => value !== undefined)
        .map(humanize)
        .join(' ')
    parts.push({ key: 'worker_path', text })
  }

  const rank = (key: string) => {
    if (key === 'pipeline_id') return ETL_PART_ORDER.length + 1
    const index = ETL_PART_ORDER.indexOf(key)
    return index === -1 ? ETL_PART_ORDER.length : index
  }
  return parts.sort((a, b) => rank(a.key) - rank(b.key) || a.key.localeCompare(b.key))
}

export const WAREHOUSE_ETL_LABEL_PROPS = {
  formatLabels: formatWarehouseEtlLabels,
  hideSharedLabels: true,
} as const

type ExpandedSeries = WarehouseChartSeries & { parts?: WarehouseSeriesLabelPart[] }

export const expandWarehouseChartSeries = (
  series: WarehouseChartSeries[],
  { formatLabels = formatRawLabels, hideSharedLabels = false }: WarehouseSeriesLabelOptions = {}
) => {
  const expanded = series.flatMap(({ metric, label }): ExpandedSeries[] => {
    if (!metric || metric.series.length === 0) return [{ metric, label }]
    return [...metric.series]
      .sort((a, b) => getLabelKey(a.labels).localeCompare(getLabelKey(b.labels)))
      .map((item) => ({
        metric: { ...metric, series: [item] },
        label,
        parts: formatLabels(item.labels),
      }))
  })

  const labelled = expanded.flatMap(({ parts }) => (parts && parts.length > 0 ? [parts] : []))
  const isShared = (part: WarehouseSeriesLabelPart) =>
    hideSharedLabels &&
    labelled.every((parts) => parts.some((p) => p.key === part.key && p.text === part.text))

  return expanded.map(({ metric, label, parts }) => ({
    metric,
    label: [label, ...(parts ?? []).filter((part) => !isShared(part)).map((part) => part.text)]
      .filter(Boolean)
      .join(' · '),
  }))
}

export const getWarehouseSeriesRank = ({ metric }: WarehouseChartSeries) => {
  const points = metric?.series.flatMap((series) => series.points) ?? []
  const measuredPoints = points.filter(
    (point) => point.value !== null && Number.isFinite(point.value)
  )
  if (measuredPoints.some((point) => point.value !== 0)) return 2
  return measuredPoints.length > 0 ? 1 : 0
}

export const getWarehouseChartPoints = (series: WarehouseChartSeries[], scale: number) => {
  const rows = new Map<number, Record<string, string | number>>()
  series.forEach(({ metric }, index) => {
    if (metric?.series.length !== 1) return
    metric.series[0].points.forEach(({ timestamp, value }) => {
      const row = rows.get(timestamp) ?? { timestamp: new Date(timestamp * 1000).toISOString() }
      if (value !== null && Number.isFinite(value)) row[`value${index}`] = value * scale
      rows.set(timestamp, row)
    })
  })
  return [...rows.entries()].sort(([a], [b]) => a - b).map(([, row]) => row)
}

export const getWarehouseSeriesPeak = ({ metric }: WarehouseChartSeries) =>
  Math.max(
    0,
    ...(metric?.series.flatMap((series) =>
      series.points.flatMap((point) =>
        point.value !== null && Number.isFinite(point.value) ? [Math.abs(point.value)] : []
      )
    ) ?? [])
  )

const formatNumber = (value: number, maximumFractionDigits: number) =>
  value.toLocaleString(undefined, { maximumFractionDigits })

export const formatWarehouseCount = (value: number) => formatNumber(value, 1)

export const formatWarehousePerSecond = (perSecond: number) => `${formatNumber(perSecond, 2)}/s`

export const formatWarehousePerMinute = (perSecond: number) =>
  `${formatNumber(perSecond * 60, 2)}/min`

export const formatWarehouseBytes = (bytes: number) =>
  Math.abs(bytes) < 1 ? `${formatNumber(bytes, 2)} bytes` : formatBytes(bytes, 1)

export const formatWarehouseBytesPerSecond = (bytesPerSecond: number) =>
  `${formatWarehouseBytes(bytesPerSecond)}/s`

export const formatWarehouseRatio = (ratio: number) => `${formatNumber(ratio * 100, 1)}%`

export const formatWarehouseDuration = (seconds: number): string => {
  if (seconds < 0) return `-${formatWarehouseDuration(-seconds)}`
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`
  if (seconds < 60) return `${formatNumber(seconds, 1)} s`
  const whole = Math.floor(seconds)
  const units: [string, number][] = [
    ['d', Math.floor(whole / 86400)],
    ['h', Math.floor((whole % 86400) / 3600)],
    ['m', Math.floor((whole % 3600) / 60)],
    ['s', whole % 60],
  ]
  return units
    .filter(([, amount]) => amount > 0)
    .slice(0, 2)
    .map(([unit, amount]) => `${amount}${unit}`)
    .join(' ')
}

export const formatWarehousePaused = (value: number) => (value > 0 ? 'Paused' : 'Not paused')
