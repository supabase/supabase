import dayjs, { type Dayjs } from 'dayjs'

import {
  WAREHOUSE_METRICS_MAX_RANGE_DAYS,
  WAREHOUSE_METRICS_MAX_SERIES,
  type WarehouseChartDef,
} from './WarehouseMetrics.constants'
import type { MultiAttribute } from '@/components/ui/Charts/ComposedChart.utils'
import type {
  WarehouseMetric,
  WarehouseMetricsInterval,
  WarehouseMetricsResponse,
} from '@/data/warehouse/warehouse-metrics-api-types'
import type { WarehouseMetricsError } from '@/data/warehouse/warehouse-metrics-query'

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
 * - `total`: the sum across series, computed by ComposedChart (a single rate or count metric split by labels).
 * - `none`: no headline, because any one slice (or a sum of slices) would be misleading.
 */
export type WarehouseChartHighlight = 'primary' | 'total' | 'none'

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
  chart: WarehouseChartDef,
  maxSeries: number = WAREHOUSE_METRICS_MAX_SERIES
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
  const isSummableFormat = chart.format === '/s' || chart.format === ''
  const isSingleMetric = chart.series.length === 1

  let highlight: WarehouseChartHighlight = 'none'
  if (primarySeriesCount <= 1) highlight = 'primary'
  else if (isSingleMetric && isSummableFormat) highlight = 'total'

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

export type WarehouseMetricsPageState =
  | { status: 'ready' }
  | { status: 'not_provisioned' }
  | { status: 'disabled' }
  | { status: 'all_failed'; error: WarehouseMetricsError }

export const getWarehouseMetricsPageState = (
  results: {
    status: 'pending' | 'error' | 'success'
    data?: WarehouseMetricsResponse
    error: WarehouseMetricsError | null
  }[]
): WarehouseMetricsPageState => {
  const isEveryMetric = (status: WarehouseMetric['availability']) =>
    results.some(
      (result) =>
        result.status === 'success' &&
        !!result.data &&
        result.data.metrics.length > 0 &&
        result.data.metrics.every((metric) => metric.availability === status)
    )

  if (isEveryMetric('not_provisioned')) return { status: 'not_provisioned' }
  if (isEveryMetric('disabled')) return { status: 'disabled' }

  const isAllFailed = results.length > 0 && results.every((result) => result.status === 'error')
  const firstError = results.find((result) => result.error !== null)?.error
  if (isAllFailed && firstError) return { status: 'all_failed', error: firstError }

  return { status: 'ready' }
}

/** Keeps every series under ~720 points so a batch with many labeled series stays under the API's response cap. */
export const getWarehouseMetricsInterval = (
  startIso: string,
  endIso: string
): WarehouseMetricsInterval => {
  const hours = dayjs(endIso).diff(dayjs(startIso), 'hour', true)
  if (hours <= 3) return '1m'
  if (hours <= 24) return '5m'
  if (hours <= 24 * 5) return '30m'
  return '1h'
}

export type WarehouseMetricsRange =
  | {
      status: 'ok'
      startDate: string
      endDate: string
      interval: WarehouseMetricsInterval
      isClamped: boolean
    }
  | { status: 'out_of_range' }

export const resolveWarehouseMetricsRange = ({
  start,
  end,
  now = dayjs(),
}: {
  start: string
  end: string
  now?: Dayjs
}): WarehouseMetricsRange => {
  const latest = now.startOf('minute')
  // Counted in hours, not calendar days, so a DST change doesn't shift the bound
  // A few minutes of slack so the oldest bound doesn't fall out of range while the page is open
  const earliest = latest.subtract(WAREHOUSE_METRICS_MAX_RANGE_DAYS * 24, 'hour').add(5, 'minute')

  const isStartTooEarly = dayjs(start).isBefore(earliest)
  const isEndInFuture = dayjs(end).isAfter(now)

  const startDate = (isStartTooEarly ? earliest : dayjs(start)).toISOString()
  const endDate = (isEndInFuture ? latest : dayjs(end)).toISOString()

  if (!dayjs(endDate).isAfter(dayjs(startDate))) return { status: 'out_of_range' }

  return {
    status: 'ok',
    startDate,
    endDate,
    interval: getWarehouseMetricsInterval(startDate, endDate),
    isClamped: isStartTooEarly || isEndInFuture,
  }
}
