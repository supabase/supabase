import type { MultiAttribute } from '@/components/ui/Charts/ComposedChart.utils'
import type {
  WarehouseMetric,
  WarehouseMetricName,
  WarehouseMetricsResponse,
} from '@/data/warehouse/warehouse-metrics-api-types'

export interface WarehouseChartInput {
  format: 'ms' | '/s' | ''
  primaryMetric: WarehouseMetricName
  series: readonly { metric: WarehouseMetricName; label: string; isLimit?: boolean }[]
}

export type WarehouseChartRow = { timestamp: string } & Record<string, string | number | null>

export type WarehouseChartAvailability =
  | { status: 'ok' }
  | { status: 'partial' }
  | { status: 'stale'; lastSampleAt: string | null }
  | { status: 'insufficient_data' }
  | { status: 'no_data' }
  | { status: 'unavailable' }

/**
 * What the headline number above a chart shows:
 * - `primary`: the latest value of the primary series (the primary metric has at most one series).
 * - `none`: no headline, because any one slice (or a sum of slices) would be misleading.
 */
export type WarehouseChartHighlight = 'primary' | 'none'

export interface WarehouseChartModel {
  rows: WarehouseChartRow[]
  attributes: MultiAttribute[]
  primaryKey: string | undefined
  /** Latest value of the primary series. Only set when `highlight` is `primary`. */
  latestValue: number | undefined
  /** Decided from every series the API returned for the primary metric, before the series cap. */
  highlight: WarehouseChartHighlight
  /** True when at least one non-limit series has a finite value. */
  hasFiniteValues: boolean
  availability: WarehouseChartAvailability
  /** Number of non-limit series the API returned. */
  totalSeries: number
  /** Number of non-limit series kept after applying the cap. */
  shownSeries: number
}

/** Joins the series name and its label values (keys sorted), skipping empty parts. */
export const formatSeriesLabel = (base: string, labels: Record<string, string>) =>
  [
    base,
    ...Object.keys(labels)
      .sort()
      .map((key) => labels[key]),
  ]
    .filter(Boolean)
    .join(' · ')

const toLabelKey = (labels: Record<string, string>) =>
  Object.keys(labels)
    .sort()
    .map((key) => `${key}=${labels[key]}`)
    .join('|')

const compareText = (a: string, b: string) => a.localeCompare(b)

export const summarizeChartAvailability = (
  metrics: (WarehouseMetric | undefined)[],
  hasFiniteValues: boolean
): WarehouseChartAvailability => {
  const statuses = metrics.map((metric) => metric?.availability ?? 'unavailable')
  const has = (status: WarehouseMetric['availability']) => statuses.includes(status)

  if (has('unavailable')) return { status: 'unavailable' }

  if (has('stale')) {
    const newest = metrics
      .filter((metric) => metric?.availability === 'stale')
      .map((metric) => metric?.last_sample_at)
      .filter((value): value is number => typeof value === 'number')
    const lastSampleAt =
      newest.length > 0 ? new Date(Math.max(...newest) * 1000).toISOString() : null
    return { status: 'stale', lastSampleAt }
  }

  if (hasFiniteValues) return has('partial') ? { status: 'partial' } : { status: 'ok' }

  if (has('insufficient_data')) return { status: 'insufficient_data' }
  return { status: 'no_data' }
}

export const buildWarehouseChartModel = (
  response: WarehouseMetricsResponse,
  chart: WarehouseChartInput,
  maxSeries: number = 8
): WarehouseChartModel => {
  const byName = new Map(response.metrics.map((metric) => [metric.metric, metric]))
  // The API returns durations in seconds. ComposedChart's tooltip only honors string formats,
  // so the values are scaled here instead.
  const scale = chart.format === 'ms' ? 1000 : 1

  const candidates = chart.series.flatMap((def, order) =>
    (byName.get(def.metric)?.series ?? []).map((series) => {
      const points = new Map(
        series.points.map((point) => [
          point.timestamp,
          point.value === null || !Number.isFinite(point.value) ? null : point.value * scale,
        ])
      )
      const finite = [...points.values()].filter((value): value is number => value !== null)
      return {
        order,
        metric: def.metric,
        labelKey: toLabelKey(series.labels),
        label: formatSeriesLabel(def.label, series.labels),
        isLimit: !!def.isLimit,
        peak: finite.length > 0 ? Math.max(...finite) : -Infinity,
        points,
      }
    })
  )

  const limits = candidates
    .filter((candidate) => candidate.isLimit)
    .sort((a, b) => compareText(a.labelKey, b.labelKey))
  const others = candidates.filter((candidate) => !candidate.isLimit)

  const kept = [...others]
    .sort((a, b) => {
      if (a.peak !== b.peak) return a.peak > b.peak ? -1 : 1
      return compareText(a.labelKey, b.labelKey)
    })
    .slice(0, maxSeries)
    // Back to declaration order so series colors stay stable between renders
    .sort((a, b) => a.order - b.order || compareText(a.labelKey, b.labelKey))

  // Opaque keys: ComposedChart switches to byte formatting for keys containing names like ram_ or network_
  const keyed = [...kept, ...limits.slice(0, 1)].map((candidate, index) => ({
    ...candidate,
    key: `s${index}`,
  }))

  const timestamps = [...new Set(keyed.flatMap((candidate) => [...candidate.points.keys()]))].sort(
    (a, b) => a - b
  )

  // Every key is present in every row because ComposedChart reads the series list from the first row
  const rows = timestamps.map((timestamp) => {
    const row: WarehouseChartRow = { timestamp: new Date(timestamp * 1000).toISOString() }
    for (const candidate of keyed) row[candidate.key] = candidate.points.get(timestamp) ?? null
    return row
  })

  const attributes: MultiAttribute[] = keyed.map((candidate) => ({
    attribute: candidate.key,
    label: candidate.label,
    stackId: candidate.key,
    ...(candidate.isLimit ? { isMaxValue: true } : {}),
  }))

  const primary = keyed.find(
    (candidate) => !candidate.isLimit && candidate.metric === chart.primaryMetric
  )
  const primaryKey = primary?.key
  const primaryValues = primary
    ? timestamps.map((timestamp) => primary.points.get(timestamp) ?? null)
    : []
  const primarySeriesCount = others.filter(
    (candidate) => candidate.metric === chart.primaryMetric
  ).length
  const highlight: WarehouseChartHighlight = primarySeriesCount <= 1 ? 'primary' : 'none'

  const latestValue =
    highlight === 'primary'
      ? [...primaryValues].reverse().find((value): value is number => value !== null)
      : undefined

  const hasFiniteValues = keyed.some(
    (candidate) => !candidate.isLimit && Number.isFinite(candidate.peak)
  )

  const availability = summarizeChartAvailability(
    chart.series.map((def) => byName.get(def.metric)),
    hasFiniteValues
  )

  return {
    rows,
    attributes,
    primaryKey,
    latestValue,
    highlight,
    hasFiniteValues,
    availability,
    totalSeries: others.length,
    shownSeries: kept.length,
  }
}
