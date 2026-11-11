import { Loader2Icon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Badge, cn } from 'ui'

import { LOG_TYPES_LABELS } from '../UnifiedLogs.constants'
import { ColumnSchema } from '../UnifiedLogs.schema'
import { getEventMessageDisplay } from '../UnifiedLogs.utils'
import { LogLevelDot } from './LogLevelDot'
import { foldTimelineSteps } from './LogTimeline.utils'
import { LogTypeIcon } from './LogTypeIcon'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'

interface LogTimelineProps {
  logs: ColumnSchema[]
  'aria-label': string
  getTimeLabel: (log: ColumnSchema) => string
  activeLogId?: string
  onSelectLog?: (log: ColumnSchema) => void
  getLogHref?: (log: ColumnSchema) => string
  collapsedStepCount?: number
  footer?: ReactNode
}

export function LogTimeline({
  logs,
  'aria-label': ariaLabel,
  getTimeLabel,
  activeLogId,
  onSelectLog,
  getLogHref,
  collapsedStepCount,
  footer,
}: LogTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const items = foldTimelineSteps(logs, {
    activeLogId,
    isExpanded,
    collapsedCount: collapsedStepCount,
  })

  return (
    <ol aria-label={ariaLabel} className="flex flex-col">
      {items.map((item, index) => {
        const hasPrev = index > 0
        const hasNext = index < items.length - 1 || !!footer
        if (item.type === 'more') {
          return (
            <TimelineMoreStep
              key={`more-${index}`}
              hasPrev={hasPrev}
              hasNext={hasNext}
              onClick={() => setIsExpanded(true)}
            >
              +{item.count} more
            </TimelineMoreStep>
          )
        }
        return (
          <TimelineStep
            key={item.log.id}
            log={item.log}
            timeLabel={getTimeLabel(item.log)}
            isActive={item.log.id === activeLogId}
            hasPrev={hasPrev}
            hasNext={hasNext}
            href={getLogHref?.(item.log)}
            onSelect={onSelectLog}
          />
        )
      })}
      {footer}
    </ol>
  )
}

const RailSegment = ({ isVisible, className }: { isVisible: boolean; className?: string }) => (
  <span className={cn('w-px', isVisible && 'bg-border', className)} />
)

const FoldedStepDots = () => (
  <span className="flex flex-col items-center gap-0.75">
    {[0, 1, 2].map((i) => (
      <span key={i} className="h-1 w-1 rounded-full bg-foreground-muted" />
    ))}
  </span>
)

const MORE_STEP_CLASS_NAME = cn(
  'group flex w-full items-center gap-3 px-4 py-1.5 text-left text-xs',
  'text-foreground-lighter hover:bg-surface-200 hover:text-foreground',
  'focus-visible:bg-surface-200 focus-visible:text-foreground focus-visible:outline-none'
)

const MoreStepContent = ({
  hasPrev = true,
  hasNext,
  children,
}: {
  hasPrev?: boolean
  hasNext: boolean
  children: ReactNode
}) => (
  <>
    <span
      aria-hidden
      className="-my-1.5 flex w-4 shrink-0 flex-col items-center gap-0.75 self-stretch"
    >
      <RailSegment isVisible={hasPrev} className="flex-1" />
      <FoldedStepDots />
      <RailSegment isVisible={hasNext} className="flex-1" />
    </span>
    {children}
  </>
)

interface TimelineMoreStepProps {
  hasPrev: boolean
  hasNext?: boolean
  onClick: () => void
  children: ReactNode
}

function TimelineMoreStep({ hasPrev, hasNext = false, onClick, children }: TimelineMoreStepProps) {
  return (
    <li>
      <button type="button" tabIndex={0} onClick={onClick} className={MORE_STEP_CLASS_NAME}>
        <MoreStepContent hasPrev={hasPrev} hasNext={hasNext}>
          {children}
        </MoreStepContent>
      </button>
    </li>
  )
}

interface TimelineStepProps {
  log: ColumnSchema
  timeLabel: string
  isActive: boolean
  hasPrev: boolean
  hasNext: boolean
  href?: string
  onSelect?: (log: ColumnSchema) => void
}

function TimelineStep({
  log,
  timeLabel,
  isActive,
  hasPrev,
  hasNext,
  href,
  onSelect,
}: TimelineStepProps) {
  const className = cn(
    'flex w-full min-w-0 items-center gap-3 px-4 py-1.5 text-left',
    'hover:bg-surface-200 focus-visible:bg-surface-200 focus-visible:outline-none',
    isActive && 'bg-surface-200'
  )
  const content = (
    <>
      <span aria-hidden className="-my-1.5 flex w-4 shrink-0 flex-col items-center self-stretch">
        <RailSegment isVisible={hasPrev} className="h-[13px] shrink-0" />
        <LogLevelDot level={log.level} />
        <RailSegment isVisible={hasNext} className="flex-1" />
      </span>
      <LogStepRow log={log} timeLabel={timeLabel} />
    </>
  )

  return (
    <li>
      {href ? (
        <a href={href} aria-current={isActive ? 'true' : undefined} className={className}>
          {content}
        </a>
      ) : (
        <button
          type="button"
          tabIndex={0}
          aria-current={isActive ? 'true' : undefined}
          onClick={() => onSelect?.(log)}
          className={className}
        >
          {content}
        </button>
      )}
    </li>
  )
}

function LogStepRow({ log, timeLabel }: { log: ColumnSchema; timeLabel: string }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2 font-mono text-xs leading-5 tracking-tight">
      <LogTypeIcon type={log.log_type} className="shrink-0 text-foreground-lighter" />
      <span className="w-8 shrink-0">
        {log.status !== null && log.status !== undefined && (
          <DataTableColumnStatusCode value={log.status} level={log.level ?? undefined} />
        )}
      </span>
      {hasRequest(log) && <span className="shrink-0 text-foreground-lighter">{log.method}</span>}
      <span className="min-w-0 flex-1 truncate text-foreground-light">{getLogMessage(log)}</span>
      <span className="shrink-0 text-foreground-lighter">{timeLabel}</span>
    </span>
  )
}

/** One-line identity of a log: type icon, status, and its request or message. */
export function LogStepSummary({ log, isLoading }: { log: ColumnSchema; isLoading?: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 text-base font-medium leading-6 text-foreground">
      {isLoading ? (
        // Matches the log type icon's size so the summary doesn't move when loading ends
        <span className="inline-flex" role="img" aria-label="Loading log details">
          <Loader2Icon
            size={14}
            strokeWidth={1.5}
            className="shrink-0 animate-spin text-foreground-lighter"
          />
        </span>
      ) : (
        <LogTypeIcon
          type={log.log_type}
          label={getLogTypeLabel(log.log_type)}
          className="shrink-0 text-foreground-lighter"
        />
      )}
      {!!log.status && (
        <>
          <Badge
            variant={log.level ? STATUS_BADGE_VARIANTS[log.level] : 'default'}
            className="shrink-0 font-mono"
          >
            {log.status}
          </Badge>{' '}
        </>
      )}
      {hasRequest(log) ? (
        <span className="flex min-w-0 gap-1">
          <span className="shrink-0">{log.method}</span>{' '}
          {/* Clip long paths from the start so the most specific segment stays visible */}
          <span dir="rtl" className="truncate text-left">
            <bdi dir="ltr">{log.pathname}</bdi>
          </span>
        </span>
      ) : (
        <span className="min-w-0 truncate">{getLogMessage(log)}</span>
      )}
    </div>
  )
}

const STATUS_BADGE_VARIANTS = {
  success: 'default',
  warning: 'warning',
  error: 'destructive',
} as const

const LOG_TYPE_LABELS: Partial<Record<string, string>> = {
  ...LOG_TYPES_LABELS,
  function_logs: 'Edge Function console',
}

function getLogTypeLabel(logType: string) {
  return LOG_TYPE_LABELS[logType] ?? logType
}

function hasRequest(log: ColumnSchema) {
  return !!log.method && !!log.pathname
}

function getLogMessage(log: ColumnSchema) {
  if (hasRequest(log)) return log.pathname
  return getEventMessageDisplay(log.log_type, log.event_message).message ?? log.pathname
}
