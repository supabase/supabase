import { useState, type ReactNode } from 'react'
import { cn } from 'ui'

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
  /** Shown on the right of each step, e.g. an offset or a time. */
  getTimeLabel: (log: ColumnSchema) => string
  /** Highlighted as the open log. */
  activeLogId?: string
  /** Opens a step in place. */
  onSelectLog?: (log: ColumnSchema) => void
  /** Links each step elsewhere instead of opening it in place. */
  getLogHref?: (log: ColumnSchema) => string
  /** Shows this many leading steps, plus the open log in its original position. */
  collapsedStepCount?: number
  /** A final step, e.g. `TimelineLinkStep` to see more. */
  footer?: ReactNode
}

/** Logs as steps on a rail, oldest or newest first as given. */
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
  const { leadingLogs, activeLog, hiddenBefore, hiddenAfter } = foldTimelineSteps(logs, {
    activeLogId,
    isExpanded,
    collapsedCount: collapsedStepCount,
  })
  const renderStep = (log: ColumnSchema, hasPrev: boolean, hasNext: boolean) => (
    <TimelineStep
      key={log.id}
      log={log}
      timeLabel={getTimeLabel(log)}
      isActive={log.id === activeLogId}
      hasPrev={hasPrev}
      hasNext={hasNext}
      href={getLogHref?.(log)}
      onSelect={onSelectLog}
    />
  )

  return (
    <ol aria-label={ariaLabel} className="flex flex-col">
      {leadingLogs.map((log, index) =>
        renderStep(
          log,
          index > 0,
          index < leadingLogs.length - 1 ||
            hiddenBefore > 0 ||
            !!activeLog ||
            hiddenAfter > 0 ||
            !!footer
        )
      )}
      {hiddenBefore > 0 && (
        <TimelineMoreStep
          hasPrev={leadingLogs.length > 0}
          hasNext
          onClick={() => setIsExpanded(true)}
        >
          +{hiddenBefore} more
        </TimelineMoreStep>
      )}
      {activeLog &&
        renderStep(
          activeLog,
          leadingLogs.length > 0 || hiddenBefore > 0,
          hiddenAfter > 0 || !!footer
        )}
      {hiddenAfter > 0 && (
        <TimelineMoreStep
          hasPrev={leadingLogs.length > 0 || !!activeLog}
          hasNext={!!footer}
          onClick={() => setIsExpanded(true)}
        >
          +{hiddenAfter} more
        </TimelineMoreStep>
      )}
      {footer}
    </ol>
  )
}

// The rail is drawn per step as segments above and below the step's marker,
// stretched over the step's vertical padding so consecutive steps join up.
const RailSegment = ({ isVisible, className }: { isVisible: boolean; className?: string }) => (
  <span className={cn('w-px', isVisible && 'bg-border', className)} />
)

// Stands in for the steps it hides, so it reads as part of the rail
const FoldedStepDots = () => (
  <span className="flex flex-col items-center gap-[3px]">
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
      className="-my-1.5 flex w-4 shrink-0 flex-col items-center gap-[3px] self-stretch"
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
  /** Draws the rail down to the next step. */
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

/** A last step that links to more logs, drawn like the fold step. */
export function TimelineLinkStep({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <a href={href} className={MORE_STEP_CLASS_NAME}>
        <MoreStepContent hasNext={false}>{children}</MoreStepContent>
      </a>
    </li>
  )
}

interface TimelineStepProps {
  log: ColumnSchema
  timeLabel: string
  isActive: boolean
  /** Draws the rail up to the previous step. */
  hasPrev: boolean
  /** Draws the rail down to the next step. */
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
      {/* Stretched over the step's padding; the top segment centers the dot on the row */}
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

/** A timeline step on one line, like a row of the logs list: type, status, request or message, then time. */
function LogStepRow({ log, timeLabel }: { log: ColumnSchema; timeLabel: string }) {
  const hasRequest = !!log.method && !!log.pathname
  const message = hasRequest
    ? log.pathname
    : (getEventMessageDisplay(log.log_type, log.event_message).message ?? log.pathname)

  return (
    <span className="flex min-w-0 flex-1 items-center gap-2 font-mono text-xs leading-5 tracking-tight">
      <LogTypeIcon type={log.log_type} className="shrink-0 text-foreground-lighter" />
      {/* Fixed width, as in the list, so the requests line up */}
      <span className="w-8 shrink-0">
        {log.status !== null && log.status !== undefined && (
          <DataTableColumnStatusCode value={log.status} level={log.level ?? undefined} />
        )}
      </span>
      {hasRequest && <span className="shrink-0 text-foreground-lighter">{log.method}</span>}
      <span className="min-w-0 flex-1 truncate text-foreground-light">{message}</span>
      <span className="shrink-0 text-foreground-lighter">{timeLabel}</span>
    </span>
  )
}

/**
 * A log's type, status, and time over its message, as a timeline step shows it.
 * Also leads the log side panel so the open log reads like its timeline step.
 */
export function LogStepSummary({
  log,
  timeLabel,
  className,
}: {
  log: ColumnSchema
  /** e.g. an offset; omit where the time is shown elsewhere. */
  timeLabel?: string
  className?: string
}) {
  return (
    <span className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)}>
      <span className="flex min-w-0 items-center gap-2 text-sm">
        <LogTypeIcon type={log.log_type} className="shrink-0 text-foreground-lighter" />
        <span className="truncate text-foreground">{getLogTypeLabel(log.log_type)}</span>
        {log.status !== null && log.status !== undefined && (
          // Coloured by level, as in the logs list
          <DataTableColumnStatusCode
            value={log.status}
            level={log.level ?? undefined}
            className="shrink-0 text-sm"
          />
        )}
        {timeLabel && (
          <span className="ml-auto shrink-0 font-mono text-xs text-foreground-lighter">
            {timeLabel}
          </span>
        )}
      </span>
      <span className="truncate font-mono text-xs text-foreground-light">{getLogSummary(log)}</span>
    </span>
  )
}

const EXTRA_LOG_TYPE_LABELS: Record<string, string> = {
  function_logs: 'Edge Function console',
}

function getLogTypeLabel(logType: string) {
  if (logType in LOG_TYPES_LABELS) {
    return LOG_TYPES_LABELS[logType as keyof typeof LOG_TYPES_LABELS]
  }
  return EXTRA_LOG_TYPE_LABELS[logType] ?? logType
}

function getLogSummary(log: ColumnSchema) {
  if (log.method && log.pathname) return `${log.method} ${log.pathname}`
  return getEventMessageDisplay(log.log_type, log.event_message).message ?? log.pathname ?? ''
}
