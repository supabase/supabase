import {
  queryDisplaySchema,
  type ChartConfig,
  type QueryDisplay,
  type QuerySource,
  type Row,
} from '../contract'

/** A separate revision protects display choices without invalidating SQL edits. */
export class QueryDisplayState {
  revision = 0
  display: QueryDisplay

  constructor(initial: QueryDisplay = { view: 'table' }) {
    this.display = queryDisplaySchema.parse(initial)
  }

  change(value: QueryDisplay, expectedRevision?: number) {
    if (expectedRevision !== undefined && expectedRevision !== this.revision) {
      throw new Error('The result display changed. Read the workspace again before changing it.')
    }
    const parsed = queryDisplaySchema.parse(value)
    // Switching to the table keeps the chart settings for when the user switches back.
    const next = { ...parsed, chart: parsed.chart ?? this.display.chart }
    if (JSON.stringify(next) !== JSON.stringify(this.display)) {
      this.display = next
      this.revision++
    }
    return { display: this.display, displayRevision: this.revision }
  }
}

export function numericValue(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'string' && !value.trim()) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

/**
 * Checks a chart configuration against the rows it will plot. Series use
 * positional keys so customer column names never become CSS or SVG identifiers
 * and dotted or bracketed names are never read as object paths.
 */
export function prepareChart(rows: readonly Row[], chart: ChartConfig) {
  const series = chart.y_series.map((label, index) => ({ key: `series_${index}`, label }))
  const totals = series.map(() => 0)
  let invalidValues = 0
  const data = rows.map((row) => {
    const x = row[chart.x_column]
    const point: Record<string, string | number | null> = { x_value: axisLabel(x) }
    series.forEach(({ key, label }, index) => {
      const value = numericValue(row[label])
      if (value === null) invalidValues++
      // Studio's cumulative transform treats null and non-numeric values as zero.
      totals[index] += value ?? 0
      point[key] = chart.cumulative ? totals[index] : value
    })
    return point
  })
  const columns = new Set(rows.flatMap((row) => Object.keys(row)))
  const missing = [chart.x_column, ...chart.y_series].filter((column) => !columns.has(column))
  const logDisabledReason = getLogDisabledReason(rows, series, data)
  const scale: ChartConfig['scale'] = chart.scale === 'log' && !logDisabledReason ? 'log' : 'linear'
  const hasValues = data.some((point) => series.some(({ key }) => point[key] !== null))
  return { data, series, missing, invalidValues, hasValues, scale, logDisabledReason }
}

function axisLabel(value: unknown) {
  if (value == null) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getLogDisabledReason(
  rows: readonly Row[],
  series: { key: string; label: string }[],
  data: Record<string, string | number | null>[]
) {
  if (series.length !== 1) return 'Log scale requires a single Y axis column.'
  if (!rows.length) return 'Run the query to use log scale.'
  const hasNonPositive =
    rows.some((row) => {
      const value = numericValue(row[series[0].label])
      return value === null || value <= 0
    }) || data.some((point) => Number(point.series_0) <= 0)
  if (hasNonPositive) return 'Log scale requires positive numeric values in every row.'
  return undefined
}

const TIMEZONELESS_TIMESTAMP = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/

/**
 * ClickHouse returns UTC DateTime64 strings without a timezone suffix.
 * Microseconds are cut to milliseconds, which every Date parser accepts.
 */
export function parseChartTimestamp(value: unknown, isLogs = false): Date {
  if (typeof value !== 'string' && typeof value !== 'number') return new Date(NaN)
  if (isLogs && typeof value === 'string' && TIMEZONELESS_TIMESTAMP.test(value)) {
    return new Date(value.replace(' ', 'T').replace(/(\.\d{3})\d+$/, '$1') + 'Z')
  }
  return new Date(value)
}

export function formatTimestamp(value: unknown, isLogs = false): string {
  if (typeof value !== 'string' && typeof value !== 'number') return ''
  const date = parseChartTimestamp(value, isLogs)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Rows ready for the shared chart. Log timestamps on the X axis are rewritten as
 * ISO strings in UTC, because the chart parses them as local time otherwise.
 */
export function chartRowsForSource(
  rows: readonly Row[],
  chart: ChartConfig,
  source: QuerySource
): Row[] {
  if (source !== 'logs' || !chart.x_column) return [...rows]
  return rows.map((row) => {
    const value = row[chart.x_column]
    if (typeof value !== 'string' || !TIMEZONELESS_TIMESTAMP.test(value)) return row
    const date = parseChartTimestamp(value, true)
    if (Number.isNaN(date.getTime())) return row
    return { ...row, [chart.x_column]: date.toISOString() }
  })
}
