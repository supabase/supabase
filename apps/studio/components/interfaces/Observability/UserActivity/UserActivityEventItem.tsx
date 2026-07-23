import dayjs from 'dayjs'
import { Badge, cn } from 'ui'

import {
  isErrorStatus,
  SERVICE_DOT_COLOR,
  statusBadgeVariant,
  type UserActivityEvent,
} from './UserActivity.constants'

interface UserActivityEventItemProps {
  event: UserActivityEvent
  /** Hide the connector line below the last item */
  isLast?: boolean
}

export const UserActivityEventItem = ({ event, isLast = false }: UserActivityEventItemProps) => {
  const hasError = isErrorStatus(event.status)

  return (
    <div className="relative flex gap-x-4">
      {/* Connector line + status dot */}
      <div className="relative flex w-3 flex-shrink-0 justify-center">
        {!isLast && (
          <span className="absolute top-4 bottom-[-1.25rem] w-px bg-border" aria-hidden />
        )}
        <span
          className={cn(
            'relative z-10 mt-3 h-2.5 w-2.5 rounded-full',
            hasError
              ? 'border-2 border-destructive-600 bg-background'
              : SERVICE_DOT_COLOR[event.service]
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
          <p className="text-sm text-foreground">{event.title}</p>
          <span className="font-mono text-xs text-foreground-lighter tabular-nums">
            {dayjs(event.timestamp).format('HH:mm:ss')}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge variant="default" className="gap-x-1.5">
            <span
              className={cn('h-1.5 w-1.5 rounded-full', SERVICE_DOT_COLOR[event.service])}
              aria-hidden
            />
            {event.service}
          </Badge>
          <span className="font-mono text-xs text-foreground-light">
            {event.method} {event.path}
          </span>
          <span className="text-foreground-lighter">·</span>
          <Badge variant={statusBadgeVariant(event.status)}>{event.status}</Badge>
          <span className="text-foreground-lighter">·</span>
          <span className="font-mono text-xs text-foreground-lighter">{event.durationMs}ms</span>
        </div>
      </div>
    </div>
  )
}
