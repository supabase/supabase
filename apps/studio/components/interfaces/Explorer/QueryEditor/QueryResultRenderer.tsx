import { Loader2Icon, PlayIcon } from 'lucide-react'

import { type SqlSnippetSource } from '../../SQLEditor/querySource'
import { type QueryResult } from '../types'
import { QueryResultChart } from './QueryResultChart'
import { QueryResultError } from './QueryResultError'
import { QueryResultTable, type ResultRowSelection } from './QueryResultTable'
import type { QueryResultEditing } from './useQueryResultEditing'
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
  /** Present when the surface lets results be edited in place. */
  editing?: QueryResultEditing
  /** A run is under way; shown only while there's no earlier result to keep on screen. */
  isRunning?: boolean
  rowSelection?: ResultRowSelection
}

export const QueryResultRenderer = ({
  result,
  view,
  chart,
  sql,
  source,
  onDebug,
  editing,
  isRunning = false,
  rowSelection,
}: QueryResultRendererProps) => {
  const { rows, error, autoLimit } = result ?? {}

  if (!result && isRunning) {
    return (
      <div role="status" className="flex items-center gap-x-2 p-3 w-full">
        <Loader2Icon size={12} className="animate-spin text-foreground-lighter" />
        <p className="text-xs text-foreground-lighter">Running query...</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex items-center gap-x-2 p-3 w-full">
        <PlayIcon size={12} className="text-foreground-lighter" />
        <p className="text-xs text-foreground-lighter">Run the query to see results</p>
      </div>
    )
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
    return <p className="text-xs text-foreground-lighter p-3">Success. No rows returned</p>
  }

  if (rows && rows.length > 0) {
    if (view === 'table')
      return editing ? (
        <QueryResultTable result={result} editing={editing} rowSelection={rowSelection} />
      ) : (
        <DataGridResults rows={rows} />
      )
    if (view === 'chart') return <QueryResultChart chart={chart} result={result} />
  }

  return null
}
