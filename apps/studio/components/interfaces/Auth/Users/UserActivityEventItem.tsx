import dayjs from 'dayjs'
import { ExternalLink, FileJson2 } from 'lucide-react'
import Link from 'next/link'
import { Badge, Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import {
  isErrorLevel,
  LEVEL_DOT_COLOR,
  levelBadgeVariant,
  type UserActivityEvent,
} from './UserActivity.constants'
import { describeUserActivityEvent } from './UserActivity.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

/** How far before/after the event to open the Logs Explorer's date range. */
const LOGS_JUMP_WINDOW_MS = 5 * 60 * 1000

interface UserActivityEventItemProps {
  event: UserActivityEvent
  projectRef: string | undefined
  onViewPayload: (event: UserActivityEvent) => void
  /** Hide the connector line below the last item */
  isLast?: boolean
  /** Indent the content card so it reads as nested under an omitted-events group, while
   * keeping the connector dot aligned with the group's line above it */
  indented?: boolean
}

export const UserActivityEventItem = ({
  event,
  projectRef,
  onViewPayload,
  isLast = false,
  indented = false,
}: UserActivityEventItemProps) => {
  const hasError = isErrorLevel(event.level)
  const logsHref = projectRef
    ? `/project/${projectRef}/logs?date=${event.timestampMs - LOGS_JUMP_WINDOW_MS}-${event.timestampMs + LOGS_JUMP_WINDOW_MS}&id=${event.id}`
    : undefined
  const description = describeUserActivityEvent(event.logType, event.eventMessage)
  const requestLine = `${event.method ?? ''} ${event.pathname ?? ''}`.trim()

  return (
    <div className="relative flex gap-x-4">
      {/* Connector line + status dot */}
      <div className="relative flex w-3 shrink-0 justify-center">
        {!isLast && (
          <span className="absolute top-4 bottom-[-1.25rem] w-px bg-border" aria-hidden />
        )}
        <span
          className={cn(
            'relative z-10 mt-3 h-2.5 w-2.5 rounded-full',
            hasError
              ? 'border-2 border-destructive-600 bg-background'
              : LEVEL_DOT_COLOR[event.level]
          )}
          aria-hidden
        />
      </div>

      {/* Event card */}
      <div
        className={cn(
          'mb-3 flex-1 rounded-md px-4 py-3',
          indented && 'ml-6',
          hasError ? 'border border-destructive-300 bg-destructive-200/30' : 'bg-surface-100/50'
        )}
      >
        <div className="flex items-center justify-between gap-x-4">
          <div className="flex items-center gap-x-2 min-w-0">
            {event.status !== null && (
              <Badge variant={levelBadgeVariant(event.level)}>{event.status}</Badge>
            )}
            <div className="flex flex-col min-w-0">
              <span
                className={cn(
                  'truncate',
                  description
                    ? 'text-sm text-foreground'
                    : 'font-mono text-xs text-foreground-light'
                )}
              >
                {description ?? requestLine}
              </span>
              {description && requestLine && (
                <span className="font-mono text-xs text-foreground-lighter truncate">
                  {requestLine}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-x-1 shrink-0">
            <span className="font-mono text-xs text-foreground-lighter tabular-nums">
              {dayjs(event.timestampMs).format('HH:mm:ss')}
            </span>
            {logsHref ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="text" size="tiny" className="px-1">
                    <Link href={logsHref}>
                      <ExternalLink size={14} strokeWidth={1.5} />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">View in Logs Explorer</TooltipContent>
              </Tooltip>
            ) : (
              <ButtonTooltip
                variant="text"
                size="tiny"
                className="px-1"
                disabled
                icon={<ExternalLink size={14} strokeWidth={1.5} />}
                tooltip={{ content: { side: 'top', text: 'View in Logs Explorer' } }}
              />
            )}
            <ButtonTooltip
              variant="text"
              size="tiny"
              className="px-1"
              icon={<FileJson2 size={14} strokeWidth={1.5} />}
              onClick={() => onViewPayload(event)}
              tooltip={{ content: { side: 'top', text: 'View payload' } }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
