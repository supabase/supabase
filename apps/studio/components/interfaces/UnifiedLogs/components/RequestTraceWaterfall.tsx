import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { WaypointsIcon } from 'lucide-react'
import { Button, Skeleton } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { Trace } from 'ui-patterns/Trace'

import { toTraceData } from './RequestTraceWaterfall.utils'
import { AlertError } from '@/components/ui/AlertError'
import { unifiedLogTraceSpansQueryOptions } from '@/data/logs/unified-log-trace-spans-query'

interface RequestTraceWaterfallProps {
  traceId: string
  logCount?: number
  onViewTimeline?: () => void
}

export function RequestTraceWaterfall({
  traceId,
  logCount = 0,
  onViewTimeline,
}: RequestTraceWaterfallProps) {
  const { ref: projectRef } = useParams()
  const { data, error, isLoading, isError } = useQuery(
    unifiedLogTraceSpansQueryOptions({ projectRef, traceId })
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4" aria-label="Loading trace spans">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <AlertError error={error} subject="Failed to retrieve trace spans" className="m-4" />
  }

  if (!data || data.data.length === 0) {
    const hasCorrelatedLogs = logCount > 0 && !!onViewTimeline
    return (
      <div className="flex min-h-full items-center justify-center p-4">
        <EmptyStatePresentational
          icon={WaypointsIcon}
          title="No spans found"
          description={
            hasCorrelatedLogs
              ? `This trace has no tagged spans, but there ${logCount === 1 ? 'is' : 'are'} ${logCount} correlated ${logCount === 1 ? 'log' : 'logs'}.`
              : "This trace has no spans, or they haven't been tagged for sampling yet."
          }
          className="border-0 bg-transparent px-2 py-6"
        >
          {hasCorrelatedLogs && <Button onClick={onViewTimeline}>View in Timeline</Button>}
        </EmptyStatePresentational>
      </div>
    )
  }

  const trace = toTraceData(traceId, data)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <Trace.Root trace={trace}>
        <Trace.Header className="px-3 py-2">
          <Trace.Title />
          <Trace.Status />
        </Trace.Header>
        <Trace.Waterfall treeWidth={220} className="min-h-0 flex-1">
          <Trace.Minimap />
          <Trace.Ruler>
            <Trace.CollapseAll />
            <Trace.ResetZoom />
          </Trace.Ruler>
          <Trace.Grid />
          <Trace.Cursor />
          <Trace.Rows>
            <Trace.Cell />
            <Trace.Lane>
              <Trace.Bar />
              <Trace.Timing />
              <Trace.CollapsedChildren />
              <Trace.Markers />
            </Trace.Lane>
          </Trace.Rows>
        </Trace.Waterfall>
        <Trace.Inspector />
      </Trace.Root>
    </div>
  )
}
