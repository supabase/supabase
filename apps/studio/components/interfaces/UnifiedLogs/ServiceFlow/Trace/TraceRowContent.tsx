// DEBUG-242 trace view — per-row content. Reuses Trace.Lane/Bar/Duration for
// real spans; log lines and debug notes get their own compact rendering so
// they read clearly as "Supabase logs", never mistaken for spans.
import { InfoIcon } from 'lucide-react'
import { Badge, Button, cn } from 'ui'
import { Trace, useSpan } from 'ui-patterns/Trace'

import { droppedCountOf, logEntryOf, rowKindOf, statusMessageOf } from './trace-view.utils'
import { LogTypeIcon } from '@/components/interfaces/UnifiedLogs/components/LogTypeIcon'
import { getLevelColor } from '@/components/ui/DataTable/DataTable.utils'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'

const TREE_INDENT = 14
const TREE_BASE_PADDING = 8

interface TraceRowContentProps {
  onSwitchToMax?: () => void
}

function SpanRow() {
  const { span, row } = useSpan()
  const statusMessage = statusMessageOf(span)

  return (
    <>
      <div
        className="flex w-(--trace-tree-width) shrink-0 flex-col justify-center gap-0.5 overflow-hidden border-r border-muted py-1 pr-2"
        style={{ paddingLeft: row.depth * TREE_INDENT + TREE_BASE_PADDING }}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            aria-hidden
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              span.status === 'error' && 'bg-destructive',
              span.status === 'ok' && 'bg-brand',
              span.status === 'unset' && 'border border-foreground-muted'
            )}
          />
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
            {span.name}
          </span>
          <span className="shrink-0 truncate text-xs text-foreground-lighter">
            {span.serviceName}
          </span>
          <Trace.Duration className="ml-auto" />
        </div>
        {span.status === 'error' && statusMessage && (
          <span className="truncate pl-3 text-xs text-destructive">{statusMessage}</span>
        )}
      </div>
      <Trace.Lane>
        <Trace.Bar />
      </Trace.Lane>
    </>
  )
}

function LogLineRow() {
  const { span, row } = useSpan()
  const log = logEntryOf(span)
  if (!log) return null
  const levelColor = log.level ? getLevelColor(log.level) : null

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden bg-surface-200/50 px-2"
      style={{ paddingLeft: row.depth * TREE_INDENT + TREE_BASE_PADDING }}
    >
      <Badge variant="secondary" className="shrink-0 px-1 py-0 text-xs font-normal uppercase">
        Supabase log
      </Badge>
      <LogTypeIcon type={log.log_type} size={12} className="shrink-0 text-foreground-lighter" />
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground-light">
        {log.event_message}
      </span>
      {levelColor && <span className={cn('size-1.5 shrink-0 rounded-xs', levelColor.bg)} />}
      {log.status !== null && log.status !== undefined && (
        <DataTableColumnStatusCode
          value={log.status}
          level={log.level ?? undefined}
          className="shrink-0 text-xs"
        />
      )}
    </div>
  )
}

function DebugNoteRow({ onSwitchToMax }: TraceRowContentProps) {
  const { span, row } = useSpan()
  const droppedCount = droppedCountOf(span)

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden px-2 text-foreground-lighter"
      style={{ paddingLeft: row.depth * TREE_INDENT + TREE_BASE_PADDING }}
    >
      <InfoIcon size={12} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate text-xs">
        Supabase 2xx logs not kept at min ({droppedCount} hidden)
      </span>
      <Button
        type="button"
        variant="text"
        size="tiny"
        className="shrink-0"
        onClick={(event) => {
          event.stopPropagation()
          onSwitchToMax?.()
        }}
      >
        Switch to max
      </Button>
    </div>
  )
}

export function TraceRowContent({ onSwitchToMax }: TraceRowContentProps) {
  const { span } = useSpan()
  const kind = rowKindOf(span)

  if (kind === 'log-line') return <LogLineRow />
  if (kind === 'debug-note') return <DebugNoteRow onSwitchToMax={onSwitchToMax} />
  return <SpanRow />
}
