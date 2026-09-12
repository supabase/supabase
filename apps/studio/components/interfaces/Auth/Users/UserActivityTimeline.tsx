import dayjs from 'dayjs'
import { SearchX } from 'lucide-react'
import { Fragment, useState } from 'react'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import type { UserActivityEvent } from './UserActivity.constants'
import { groupNoisyEvents } from './UserActivity.utils'
import { UserActivityEventItem } from './UserActivityEventItem'
import { UserActivityOmittedEventsItem } from './UserActivityOmittedEventsItem'
import { useFormatDateTime } from '@/lib/datetime'

interface UserActivityTimelineProps {
  events: UserActivityEvent[]
  projectRef: string | undefined
  onViewPayload: (event: UserActivityEvent) => void
  dateRangeStart: string
  dateRangeEnd: string
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
  dateRangeStart,
  dateRangeEnd,
}: UserActivityTimelineProps) => {
  const formatDateTime = useFormatDateTime()
  const dayGroups = groupEventsByDay(events)
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set())

  const toggleGroup = (id: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (events.length === 0) {
    const dateRangeFormat = 'MMM D, YYYY h:mm A'
    return (
      <EmptyStatePresentational
        icon={SearchX}
        title="No activity found"
        description={`No activity found between ${formatDateTime(dateRangeStart, dateRangeFormat)} and ${formatDateTime(dateRangeEnd, dateRangeFormat)}.`}
      />
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      {dayGroups.map(([day, dayEvents]) => {
        const items = groupNoisyEvents(dayEvents)

        return (
          <div key={day} className="flex flex-col gap-y-2">
            <p className="text-sm text-foreground-light">{dayjs(day).format('MMM D, YYYY')}</p>
            <div className="flex flex-col">
              {items.map((item, index) => {
                const isLastItem = index === items.length - 1

                if (item.kind === 'event') {
                  return (
                    <UserActivityEventItem
                      key={item.event.id}
                      event={item.event}
                      projectRef={projectRef}
                      onViewPayload={onViewPayload}
                      isLast={isLastItem}
                    />
                  )
                }

                const isExpanded = expandedGroupIds.has(item.id)
                return (
                  <Fragment key={item.id}>
                    <UserActivityOmittedEventsItem
                      count={item.events.length}
                      expanded={isExpanded}
                      onToggle={() => toggleGroup(item.id)}
                      isLast={isLastItem && !isExpanded}
                    />
                    {isExpanded &&
                      item.events.map((event, eventIndex) => (
                        <UserActivityEventItem
                          key={event.id}
                          event={event}
                          projectRef={projectRef}
                          onViewPayload={onViewPayload}
                          isLast={isLastItem && eventIndex === item.events.length - 1}
                          indented
                        />
                      ))}
                  </Fragment>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
