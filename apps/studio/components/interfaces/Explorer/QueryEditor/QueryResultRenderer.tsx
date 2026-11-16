import { CircleCheckIcon, Loader2Icon, PlayIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from 'ui'

import { type SqlSnippetSource } from '../../SQLEditor/querySource'
import { type QueryResult } from '../types'
import { QueryResultChart } from './QueryResultChart'
import { QueryResultError } from './QueryResultError'
import { DataGridResults } from '@/components/ui/DataGridResults'
import { type ChartConfig } from '@/data/content/notebooks/notebook-schema'

interface QueryResultRendererProps {
  result?: QueryResult
  /** While a run is in flight the results region shows a loading state instead of the previous result. */
  isExecuting?: boolean
  view?: 'table' | 'chart'
  chart?: ChartConfig
  /** The query that produced `result`, used to build the "Debug with Assistant" prompt on error. */
  sql?: string
  source?: SqlSnippetSource
  onDebug?: (prompt: string) => void
}

interface QueryResultStateProps extends ComponentProps<'div'> {
  icon: ReactNode
  children: ReactNode
}

/** Centered icon-over-label state for the results region (idle, loading, empty). */
const QueryResultState = ({ icon, children, className, ...props }: QueryResultStateProps) => (
  <div
    className={cn(
      'flex min-h-32 w-full flex-1 flex-col items-center justify-center gap-y-2 p-6 text-center',
      className
    )}
    {...props}
  >
    <span className="text-foreground-muted" aria-hidden>
      {icon}
    </span>
    <p className="text-sm text-foreground-light">{children}</p>
  </div>
)

export const QueryResultRenderer = ({
  result,
  isExecuting = false,
  view,
  chart,
  sql,
  source,
  onDebug,
}: QueryResultRendererProps) => {
  const { rows, error, autoLimit } = result ?? {}

  if (isExecuting) {
    return (
      <QueryResultState
        role="status"
        icon={<Loader2Icon size={20} strokeWidth={1.5} className="animate-spin" />}
      >
        Running query…
      </QueryResultState>
    )
  }

  if (!result) {
    return (
      <QueryResultState icon={<PlayIcon size={20} strokeWidth={1.5} />}>
        Run the query to see results
      </QueryResultState>
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
    return (
      <QueryResultState icon={<CircleCheckIcon size={20} strokeWidth={1.5} />}>
        Success. No rows returned
      </QueryResultState>
    )
  }

  if (rows && rows.length > 0) {
    if (view === 'table') return <DataGridResults rows={rows} />
    if (view === 'chart') return <QueryResultChart chart={chart} result={result} />
  }

  return null
}
