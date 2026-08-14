import { QueryResultChart } from './QueryResultChart'
import { QueryResultError } from './QueryResultError'
import { type QueryChartConfig, type QueryResult } from './types'
import { DataGridResults } from '@/components/ui/DataGridResults'

interface QueryResultRendererProps {
  result?: QueryResult
  view?: 'table' | 'chart'
  chart?: QueryChartConfig
}

export const QueryResultRenderer = ({ result, view, chart }: QueryResultRendererProps) => {
  const { rows, error, autoLimit } = result ?? {}

  if (!result) {
    return <p className="text-xs text-foreground-lighter">Run the query to see results</p>
  }

  if (error) {
    return <QueryResultError error={error} autoLimit={autoLimit} />
  }

  if ((rows ?? []).length === 0) {
    return <p className="text-xs text-foreground-lighter">Success. No rows returned</p>
  }

  if (rows && rows.length > 0) {
    if (view === 'table') return <DataGridResults rows={rows} />
    if (view === 'chart') return <QueryResultChart chart={chart} result={result} />
  }

  return null
}
