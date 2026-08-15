import { type ChartConfig } from '@/data/content/notebooks/notebook-schema'

export type QueryResult = {
  rows?: readonly Record<string, unknown>[]
  error?: { message: string; formattedError?: string }
  autoLimit?: number
}

/**
 * How a query's results are rendered. `chart` is kept independently of `view` so a user
 * who switches to the table and back gets their chart configuration returned rather than
 * rebuilt — the same reason the notebook wire schema persists the two separately.
 */
export type QueryDisplay = {
  view: 'table' | 'chart'
  chart?: ChartConfig
}
