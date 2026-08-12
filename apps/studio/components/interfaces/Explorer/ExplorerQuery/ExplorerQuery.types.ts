export type QueryResultColumn = {
  /** Stable key used to read this column from each result row. */
  key: string
  /** Optional display label. Defaults to `key`. */
  label?: string
  /** Source-provided type metadata, such as `int8`, `timestamp`, or `json`. */
  dataType?: string
  /** Preferred initial width in pixels. */
  width?: number
  /** Minimum resizable width in pixels. */
  minWidth?: number
  align?: 'left' | 'right'
}

export type QueryResultRow = Readonly<Record<string, unknown>>

/**
 * Source-neutral result data. Columns are explicit so an empty result can still
 * preserve its schema, order, labels, and types.
 */
export type QueryResultData = {
  columns: readonly QueryResultColumn[]
  rows: readonly QueryResultRow[]
}

export type QueryResultState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'success'; data: QueryResultData }
  | { status: 'error'; error: string }

export type QueryResultTableConfig = {
  columnWidths?: Readonly<Record<string, number>>
}

export type QueryResultChartConfig = {
  type: 'bar' | 'line'
  xKey: string
  yKey: string
  cumulative?: boolean
  showGrid?: boolean
  showLabels?: boolean
  logScale?: boolean
  color?: string
}

/** Persisted display choice owned by the ExplorerQuery consumer. */
export type QueryDisplay =
  | { kind: 'table'; config?: QueryResultTableConfig }
  | { kind: 'chart'; config: QueryResultChartConfig }
