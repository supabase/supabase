import { WaypointsIcon } from 'lucide-react'
import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { getShortTraceId, getTraceLogsHref, getTraceSummary } from './TraceSpans.utils'
import type { TraceSpan } from '@/data/logs/unified-log-trace-spans-query'

interface TraceStripProps {
  traceId: string
  projectRef: string
  logTimestampMs: number | null
  /** Undefined while the trace is loading, or when the fetch failed. */
  spans?: TraceSpan[]
  isPartial: boolean
}

export function TraceStrip({
  traceId,
  projectRef,
  logTimestampMs,
  spans,
  isPartial,
}: TraceStripProps) {
  const summary = spans === undefined ? undefined : getTraceSummary(spans)

  return (
    <div className="flex items-center gap-2 border-b px-4 py-2 text-xs">
      <WaypointsIcon size={14} className="shrink-0 text-foreground-lighter" />
      <span className="shrink-0 font-mono text-foreground-light">{getShortTraceId(traceId)}</span>
      {summary !== undefined && summary.spanCount > 0 && (
        <>
          <span className="shrink-0 text-foreground-lighter">
            {summary.spanCount === 1 ? '1 span' : `${summary.spanCount} spans`}
          </span>
          <span className="min-w-0 truncate text-foreground-lighter">
            {summary.services.join(', ')}
          </span>
        </>
      )}
      {isPartial && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="shrink-0">Partial</Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-64">
            This trace may be incomplete. Spans are still being collected, or some services did not
            report them.
          </TooltipContent>
        </Tooltip>
      )}
      <Button asChild variant="text" size="tiny" className="ml-auto shrink-0">
        <a href={getTraceLogsHref({ projectRef, traceId, logTimestampMs })}>View logs</a>
      </Button>
    </div>
  )
}
