// DEBUG-242 trace view — a timeline, not a flame chart: one row per span
// (indented by parent), Supabase logs attached as rows under the supabase-js
// span that made the call. Built on the ui-patterns/Trace components from
// PR #51184.
import type { Span } from 'ui-patterns/Trace'
import { Trace } from 'ui-patterns/Trace'

import { shortenId } from '../components/TraceRequestRow'
import { rowKindOf } from './trace-view.utils'
import { TraceRowContent } from './TraceRowContent'

interface TraceTabProps {
  traceId: string
  spans: Span[]
  hasNoLogs: boolean
  selectedId: string | null
  onSelectedIdChange: (id: string | null) => void
  onSwitchToMax: () => void
}

function formatTraceDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function TraceHeaderSummary({ traceId, spans }: { traceId: string; spans: Span[] }) {
  const realSpans = spans.filter((span) => rowKindOf(span) === 'span')
  const root = realSpans.find((span) => span.parentId === null) ?? realSpans[0]
  const starts = realSpans.map((span) => span.startMs)
  const ends = realSpans.map((span) => span.endMs ?? span.startMs)
  const durationMs = starts.length > 0 ? Math.max(...ends) - Math.min(...starts) : 0

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2 text-xs">
      <span className="font-mono text-foreground-lighter">{shortenId(traceId)}</span>
      <span className="truncate font-medium text-foreground">{root?.name ?? 'Trace'}</span>
      <span className="text-foreground-lighter">{formatTraceDuration(durationMs)}</span>
      <span className="text-foreground-lighter">
        {realSpans.length} {realSpans.length === 1 ? 'span' : 'spans'}
      </span>
    </div>
  )
}

export function TraceTab({
  traceId,
  spans,
  hasNoLogs,
  selectedId,
  onSelectedIdChange,
  onSwitchToMax,
}: TraceTabProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TraceHeaderSummary traceId={traceId} spans={spans} />
      {hasNoLogs && (
        <div className="border-b px-4 py-2 text-xs text-foreground-lighter">
          No Supabase logs to join — this trace never called Supabase.
        </div>
      )}
      <Trace.Root
        trace={{ traceId, spans }}
        selectedId={selectedId}
        onSelectedIdChange={onSelectedIdChange}
      >
        <Trace.Waterfall className="min-h-0 flex-1">
          <Trace.Ruler />
          <Trace.Rows rowHeight={44}>
            <TraceRowContent onSwitchToMax={onSwitchToMax} />
          </Trace.Rows>
        </Trace.Waterfall>
      </Trace.Root>
    </div>
  )
}
