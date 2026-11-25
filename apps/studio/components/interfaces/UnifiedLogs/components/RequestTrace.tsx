import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { AudioWaveformIcon, WaypointsIcon } from 'lucide-react'
import { Badge, Skeleton, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Trace } from 'ui-patterns/Trace'

import { getRequestCorrelationIds } from '../UnifiedLogs.queries'
import { ColumnSchema } from '../UnifiedLogs.schema'
import { getLogTypeSource, getRowTimestampMs } from '../UnifiedLogs.utils'
import { LogPanelEmptyState } from './LogPanelEmptyState'
import { getTraceStartMs, getTraceServices, toTraceData } from './RequestTrace.utils'
import { AlertError } from '@/components/ui/AlertError'
import { unifiedLogRequestTimelineQueryOptions } from '@/data/logs/unified-log-request-timeline-query'
import { unifiedLogTraceSpansQueryOptions } from '@/data/logs/unified-log-trace-spans-query'
import { useFormatDateTime } from '@/lib/datetime'

/**
 * The trace id comes from the request's correlated logs, which the Timeline tab already fetches,
 * so this shares its cache entry rather than making a request of its own.
 */
function useRequestTraceId(row: ColumnSchema, projectRef: string | undefined) {
  const { data, isLoading, isError, error } = useQuery(
    unifiedLogRequestTimelineQueryOptions({
      projectRef,
      logId: row.id,
      source: getLogTypeSource(row.log_type),
      logTimestampMs: getRowTimestampMs(row),
    })
  )

  // The selected log's own trace ID wins; a related log's trace ID is only used as a fallback,
  // and only when there's exactly one candidate — picking among several would be a guess.
  const ownTraceId = getRequestCorrelationIds([
    { source: getLogTypeSource(row.log_type) ?? '', attributes: row.metadata },
  ]).traceIds[0]

  const relatedTraceIds = data
    ? getRequestCorrelationIds(
        data.logs.map((log) => ({
          source: getLogTypeSource(log.log_type) ?? '',
          attributes: log.metadata,
        }))
      ).traceIds
    : []

  const traceId = ownTraceId ?? (relatedTraceIds.length === 1 ? relatedTraceIds[0] : undefined)

  return { traceId, isResolving: isLoading, isResolvingError: isError, resolvingError: error }
}

export function RequestTrace({ row }: { row: ColumnSchema }) {
  const { ref: projectRef } = useParams()
  const formatDateTime = useFormatDateTime()
  const { traceId, isResolving, isResolvingError, resolvingError } = useRequestTraceId(
    row,
    projectRef
  )
  const { data, error, isLoading, isError } = useQuery(
    unifiedLogTraceSpansQueryOptions({ projectRef, traceId })
  )

  if (isResolving || isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4" aria-label="Loading trace">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  }

  if (isResolvingError) {
    return (
      <AlertError
        error={resolvingError}
        subject="Couldn't load the trace"
        projectRef={projectRef}
        className="m-4"
      />
    )
  }

  if (traceId === undefined) {
    return (
      <LogPanelEmptyState
        icon={WaypointsIcon}
        title="No trace for this request"
        description="A trace appears here when the request's logs carry a trace ID."
      />
    )
  }

  if (isError) {
    return (
      <AlertError
        error={error}
        subject="Failed to retrieve trace"
        projectRef={projectRef}
        className="m-4"
      />
    )
  }

  if (data === undefined) return null

  const { trace, unplacedCount } = toTraceData(traceId, data)

  if (trace.spans.length === 0) {
    return (
      <LogPanelEmptyState
        icon={WaypointsIcon}
        title="No spans recorded"
        description="The request carries a trace ID, but nothing was recorded against it."
      />
    )
  }

  const services = getTraceServices(data.data)
  const startMs = getTraceStartMs(trace)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <Trace.Root trace={trace}>
        <Trace.Header className="border-b px-4 py-2 mt-2.5 gap-y-0.5">
          <AudioWaveformIcon size={14} className="shrink-0 text-foreground-lighter" />
          <Trace.Title />
          <Trace.Status />
          {unplacedCount > 0 && (
            <span className="text-xs text-foreground-muted">
              {unplacedCount === 1
                ? '1 span has no start time and is not shown'
                : `${unplacedCount} spans have no start time and are not shown`}
            </span>
          )}
          <span className="ml-auto flex items-center gap-2 text-xs">
            {startMs !== null && (
              <span className="font-mono text-foreground-lighter">{formatDateTime(startMs)}</span>
            )}
            {data.meta.partial && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="warning">Partial</Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-64">
                  This trace may be incomplete. Spans are still being collected, or some services
                  did not report them.
                </TooltipContent>
              </Tooltip>
            )}
          </span>
          {/* basis-full wraps this onto its own line beneath the title */}
          <span className="flex basis-full items-center gap-2 text-xs text-foreground-lighter">
            {services.length > 0 && (
              <>
                <span>{services.join(', ')}</span>
                <span aria-hidden>•</span>
              </>
            )}
            <span className="font-mono">{traceId}</span>
          </span>
        </Trace.Header>
        <Trace.Waterfall treeWidth={220} className="min-h-0 flex-1">
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
