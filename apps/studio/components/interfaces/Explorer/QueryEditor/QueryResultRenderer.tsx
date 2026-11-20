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
  /**
   * While a run is in flight the results region shows a running state. Previous rows stay
   * visible underneath, dimmed, so notebook cells keep their height instead of collapsing.
   */
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

/** Centered icon-over-label state for the results region (idle, running, empty). */
const QueryResultState = ({ icon, children, className, ...props }: QueryResultStateProps) => (
  <div
    className={cn(
      'flex w-full flex-1 flex-col items-center justify-center gap-y-2 px-6 py-8 text-center',
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

const RunningState = ({ className }: { className?: string }) => (
  <QueryResultState
    className={className}
    icon={
      <Loader2Icon
        size={20}
        strokeWidth={1.5}
        className="animate-spin motion-reduce:animate-none"
      />
    }
  >
    Running query…
  </QueryResultState>
)

const getRunAnnouncement = ({ result, isExecuting }: QueryResultRendererProps) => {
  if (isExecuting) return 'Running query…'
  if (!result) return ''
  if (result.error) return 'Query failed'
  const rowCount = result.rows?.length ?? 0
  if (rowCount === 0) return 'No rows returned'
  return `${rowCount} ${rowCount === 1 ? 'row' : 'rows'} returned`
}

const QueryResultContent = ({
  result,
  isExecuting = false,
  view,
  chart,
  sql,
  source,
  onDebug,
}: QueryResultRendererProps) => {
  const { rows, error, autoLimit } = result ?? {}
  const hasRows = rows !== undefined && rows.length > 0

  if (isExecuting && !hasRows) return <RunningState />

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

  if (!hasRows) {
    return (
      <QueryResultState icon={<CircleCheckIcon size={20} strokeWidth={1.5} />}>
        Success. No rows returned
      </QueryResultState>
    )
  }

  const rowsContent = (
    <>
      {view === 'table' && <DataGridResults rows={rows} />}
      {view === 'chart' && <QueryResultChart chart={chart} result={result} />}
    </>
  )

  if (!isExecuting) return rowsContent

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      <div className="pointer-events-none flex min-h-0 flex-1 flex-col opacity-40" aria-hidden>
        {rowsContent}
      </div>
      <RunningState className="absolute inset-0" />
    </div>
  )
}

/**
 * The visible states swap whole elements, so screen readers get run progress from one
 * status region that stays mounted while only its text changes.
 */
export const QueryResultRenderer = (props: QueryResultRendererProps) => (
  <>
    <p role="status" className="sr-only">
      {getRunAnnouncement(props)}
    </p>
    <QueryResultContent {...props} />
  </>
)
