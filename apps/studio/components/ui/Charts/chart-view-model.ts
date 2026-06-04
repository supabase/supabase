/** How a numeric value should be formatted for display. Replaces the old
 *  practice of inferring chart type by string-matching attribute names. */
export type FormatStyle =
  | 'number'
  | 'percent'
  | 'bytes'
  | 'bytes-per-second'
  | 'memory'
  | 'network'
  | 'duration-ms'
  | 'seconds'

/** Structured in-tooltip documentation for a chart or a series. */
export interface MetricDoc {
  /** What the metric means. */
  description: string
  /** When a reading is problematic / what a bad value looks like. */
  whenProblematic?: string
  /** Optional deep-dive link, demoted to a secondary "Learn more". */
  docsUrl?: string
}

export type ChartSeriesKind = 'area' | 'bar' | 'line' | 'reference-line'

/** A single render-ready series. All visual properties are already resolved
 *  (theme colors resolved upstream); the chart component does no derivation. */
export interface ChartSeries {
  key: string
  label: string
  kind: ChartSeriesKind
  color: string
  fill: string
  stackId?: string
  strokeDasharray?: string
  referenceValue?: number
  doc?: MetricDoc
}

/** Fully-prepared input for the render-only chart. Contains no logic. */
export interface ChartViewModel {
  series: ChartSeries[]
  rows: Array<Record<string, number | string>>
  xKey: string
  yAxisDomain: [number | string, number | string]
  doc?: MetricDoc
}
