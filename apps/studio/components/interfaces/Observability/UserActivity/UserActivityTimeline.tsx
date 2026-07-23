import dayjs from 'dayjs'

import type { UserActivityEvent } from './UserActivity.constants'
import { UserActivityEventItem } from './UserActivityEventItem'

interface UserActivityTimelineProps {
  events: UserActivityEvent[]
  projectRef: string | undefined
  onViewPayload: (event: UserActivityEvent) => void
}

/** Group events by calendar day, preserving chronological order. */
const groupEventsByDay = (events: UserActivityEvent[]) => {
  const groups = new Map<string, UserActivityEvent[]>()
  for (const event of events) {
    const day = dayjs(event.timestampMs).format('YYYY-MM-DD')
    const existing = groups.get(day)
    if (existing) existing.push(event)
    else groups.set(day, [event])
  }
  return Array.from(groups.entries())
}

export const UserActivityTimeline = ({
  events,
  projectRef,
  onViewPayload,
}: UserActivityTimelineProps) => {
  const dayGroups = groupEventsByDay(events)

  if (events.length === 0) {
    return <p className="text-sm text-foreground-light">No activity found in this date range.</p>
  }

  return (
    <div className="flex flex-col gap-y-6">
      {dayGroups.map(([day, dayEvents]) => (
        <div key={day} className="flex flex-col gap-y-2">
          <p className="text-sm text-foreground-light">{dayjs(day).format('MMM D, YYYY')}</p>
          <div className="flex flex-col">
            {dayEvents.map((event, index) => (
              <UserActivityEventItem
                key={event.id}
                event={event}
                projectRef={projectRef}
                onViewPayload={onViewPayload}
                isLast={index === dayEvents.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
