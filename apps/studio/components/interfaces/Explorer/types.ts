export type QueryResult = {
  rows?: readonly Record<string, unknown>[]
  error?: { message: string; formattedError?: string }
  autoLimit?: number
}

export type QueryChartConfig = {
  type: 'bar' | 'line'
  x_column: string
  y_columns: string[]
  cumulative: boolean
  scale: 'linear' | 'log'
  show_labels: boolean
}

export type QueryDisplay = {
  view: 'table' | 'chart'
  chart?: QueryChartConfig
}
