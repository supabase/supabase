import dayjs from 'dayjs'
import { Badge, cn } from 'ui'

import {
  isErrorLevel,
  LEVEL_DOT_COLOR,
  levelBadgeVariant,
  type UserActivityEvent,
} from './UserActivity.constants'
import { LOG_TYPES_LABELS } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'

interface UserActivityEventItemProps {
  event: UserActivityEvent
  /** Hide the connector line below the last item */
  isLast?: boolean
}

export const UserActivityEventItem = ({ event, isLast = false }: UserActivityEventItemProps) => {
  const hasError = isErrorLevel(event.level)
  const logTypeLabel =
    LOG_TYPES_LABELS[event.logType as keyof typeof LOG_TYPES_LABELS] ?? event.logType

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
          hasError ? 'border border-destructive-300 bg-destructive-200/30' : 'bg-surface-100/50'
        )}
      >
        <div className="flex items-start justify-between gap-x-4">
          <p className="text-sm text-foreground">{event.eventMessage}</p>
          <span className="font-mono text-xs text-foreground-lighter tabular-nums">
            {dayjs(event.timestamp).format('HH:mm:ss')}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge variant="default" className="gap-x-1.5">
            <span
              className={cn('h-1.5 w-1.5 rounded-full', LEVEL_DOT_COLOR[event.level])}
              aria-hidden
            />
            {logTypeLabel}
          </Badge>
          {(event.method || event.pathname) && (
            <span className="font-mono text-xs text-foreground-light">
              {event.method} {event.pathname}
            </span>
          )}
          {event.status !== null && (
            <>
              <span className="text-foreground-lighter">·</span>
              <Badge variant={levelBadgeVariant(event.level)}>{event.status}</Badge>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
