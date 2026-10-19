// FDBKIN-36185 / DEBUG-242: trace_id + request_id under "Request started",
// plus the phase 2 entry points into the (not-yet-built) trace view. "Open
// trace" only shows once fixture spans exist for the trace — in the real
// product that gate becomes "does query_traces return anything for this id".
import { Table } from '@tanstack/react-table'
import { Button } from 'ui'

import type { LogsColumnFilterValue } from '../../UnifiedLogs.filters'
import CopyButton from '@/components/ui/CopyButton'
import { hasSpansForTrace } from '@/lib/debug-mode/trace-fixtures'

export const shortenId = (value: string): string =>
  value.length <= 16 ? value : `${value.slice(0, 8)}…${value.slice(-4)}`

// enrichedData (per-row inspection) is checked first since it's the richer,
// more broadly populated source today; the list row's own trace_id/request_id
// (set generically off whatever metadata it carries) is the fallback.
export function resolveTraceIds(
  data: { trace_id?: string | null; request_id?: string | null },
  enrichedData?: { trace_id?: string; request_id?: string }
): { traceId: string | null; requestId: string | null } {
  return {
    traceId: enrichedData?.trace_id ?? data.trace_id ?? null,
    requestId: enrichedData?.request_id ?? data.request_id ?? null,
  }
}

interface TraceRequestRowProps {
  traceId: string | null
  requestId: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  table?: Table<any>
  onOpenTrace?: () => void
}

export function TraceRequestRow({ traceId, requestId, table, onOpenTrace }: TraceRequestRowProps) {
  if (!traceId && !requestId) return null

  const canOpenTrace = hasSpansForTrace(traceId)

  const filterByTrace = () => {
    if (!traceId) return
    table
      ?.getColumn('trace_id')
      ?.setFilterValue({ operator: '=', values: [traceId] } satisfies LogsColumnFilterValue)
  }

  return (
    <div className="flex flex-col gap-1.5 border-b px-4 py-2 pl-9.5">
      {traceId && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span className="font-sans text-sm leading-5 text-foreground-lighter">Trace ID</span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm leading-5 text-foreground">
              {shortenId(traceId)}
            </span>
            <CopyButton
              iconOnly
              aria-label="Copy trace ID"
              variant="text"
              size="tiny"
              text={traceId}
            />
            {canOpenTrace && (
              <Button type="button" variant="text" size="tiny" onClick={onOpenTrace}>
                Open trace
              </Button>
            )}
            <Button type="button" variant="text" size="tiny" onClick={filterByTrace}>
              Filter logs by trace
            </Button>
          </div>
        </div>
      )}
      {requestId && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span className="font-sans text-sm leading-5 text-foreground-lighter">Request ID</span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm leading-5 text-foreground">
              {shortenId(requestId)}
            </span>
            <CopyButton
              iconOnly
              aria-label="Copy request ID"
              variant="text"
              size="tiny"
              text={requestId}
            />
          </div>
        </div>
      )}
    </div>
  )
}
