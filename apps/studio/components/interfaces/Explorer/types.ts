import { type SqlSnippetSource } from '../SQLEditor/querySource'
import { type ChartConfig } from '@/data/content/notebooks/notebook-schema'

export type QueryResult = {
  rows?: readonly Record<string, unknown>[]
  error?: { message: string; formattedError?: string }
  autoLimit?: number
  /** The query that was submitted to produce this result, snapshotted at run time. */
  sql?: string
  source?: SqlSnippetSource
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
