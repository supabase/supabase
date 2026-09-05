import { type SqlSnippetSource } from '../../SQLEditor/querySource'
import { type QueryResult } from '../types'
import { QueryResultChart } from './QueryResultChart'
import { QueryResultError } from './QueryResultError'
import { DataGridResults } from '@/components/ui/DataGridResults'
import { type ChartConfig } from '@/data/content/notebooks/notebook-schema'

interface QueryResultRendererProps {
  result?: QueryResult
  view?: 'table' | 'chart'
  chart?: ChartConfig
  /** The query that produced `result`, used to build the "Debug with Assistant" prompt on error. */
  sql?: string
  source?: SqlSnippetSource
  onDebug?: (prompt: string) => void
}

export const QueryResultRenderer = ({
  result,
  view,
  chart,
  sql,
  source,
  onDebug,
}: QueryResultRendererProps) => {
  const { rows, error, autoLimit } = result ?? {}

  if (!result) {
    return <p className="text-xs text-foreground-lighter py-8">Run the query to see results</p>
  }

  if (error) {
    return (
      <QueryResultError
        error={error}
        autoLimit={autoLimit}
        sql={sql}
        source={source}
        onDebug={onDebug}
      />
    )
  }

  if ((rows ?? []).length === 0) {
    return <p className="text-xs text-foreground-lighter py-8">Success. No rows returned</p>
  }

  if (rows && rows.length > 0) {
    if (view === 'table') return <DataGridResults rows={rows} />
    if (view === 'chart') return <QueryResultChart chart={chart} result={result} />
  }

  return null
}
