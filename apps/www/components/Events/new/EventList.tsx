'use client'

import { useEvents } from '~/app/events/context'
import { formatHosts } from '~/lib/eventsUtils'
import { Rows3Icon } from 'lucide-react'
import Link from 'next/link'
import { Badge, Button, cn } from 'ui'

const CATEGORIES_FILTERS = [
  { name: 'All', value: 'all' },
  { name: 'Meetup', value: 'meetup' },
  { name: 'Conference', value: 'conference' },
  { name: 'Workshop', value: 'workshop' },
  { name: 'Hackathon', value: 'hackathon' },
  { name: 'Webinar', value: 'webinar' },
]

export function EventList() {
  const { isLoading, filteredEvents } = useEvents()

  const getCategoryLabel = (value: string) => {
    const category = CATEGORIES_FILTERS.find((cat) => cat.value === value)
    return category?.name || value
  }

  if (isLoading) {
    return <EventListSkeleton />
  }

  // Group events by date
  const eventsByDate = filteredEvents.reduce(
    (acc, event) => {
      const isDateOnly = event.date.endsWith('T12:00:00Z')
      const eventDate = new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...(isDateOnly ? { timeZone: 'UTC' } : {}),
      })

      if (!acc[eventDate]) {
        acc[eventDate] = []
      }
      acc[eventDate].push(event)
      return acc
    },
    {} as Record<string, typeof filteredEvents>
  )

  const hasEvents = Object.keys(eventsByDate).length > 0

  return (
    <div className="flex flex-col gap-y-8 min-h-72">
      {Object.entries(eventsByDate).map(([date, events], index) => (
        <div key={`group-${date}`} className="flex flex-col gap-y-2 relative">
          <div
            className={cn(
              'absolute top-2 left-[-59px] rounded-full size-1.5',
              index === 0 ? 'bg-brand size-2 left-[-60px]' : 'bg-foreground-muted'
            )}
          />

          <h3 className="text-foreground-light font-normal">{date}</h3>

          <div className="flex flex-col gap-y-4">
            {events.map((event, idx) => (
              <div
                key={`${idx}-${event.url}`}
                className="bg-surface-100 border rounded-md p-3 flex justify-between items-start relative"
              >
                {event.url && (
                  <Link
                    className="inset-0 absolute"
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Go to event page"
                    aria-hidden
                  />
                )}

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="leading-3">{event.title}</h3>
                      {event.isSpeaking && (
                        <Badge variant="success" className="flex items-center gap-1">
                          Speaking
                        </Badge>
                      )}
                    </div>

                    {event.end_date && (
                      <p className="text-xs text-foreground-light">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {' - '}
                        {new Date(event.end_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 items-center text-sm text-foreground-light">
                    <div className="size-5 rounded-full border bg-linear-to-br from-background-surface-100 to-background-surface-200 relative">
                      {event.hosts[0]?.avatar_url && (
                        <img
                          src={event.hosts[0].avatar_url}
                          alt={event.hosts[0].name || 'Host image'}
                          className="absolute inset-0 w-full h-full object-cover rounded-full"
                        />
                      )}
                    </div>
                    Hosted by {formatHosts(event.hosts).displayText}
                  </div>
                </div>

                <div className="flex items-center gap-2 relative z-10">
                  {event.meetingLink && (
                    <Button size="tiny" type="secondary" asChild>
                      <Link href={event.meetingLink} target="_blank" rel="noopener noreferrer">
                        Meet with us
                      </Link>
                    </Button>
                  )}
                  {event.categories.slice(0, 3).map((tag, idx) => (
                    <Badge key={`tag-${idx}`}>{getCategoryLabel(tag)}</Badge>
                  ))}
                  {event.categories.length > 3 && (
                    <Badge title={event.categories.slice(3).map(getCategoryLabel).join(', ')}>
                      +{event.categories.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!hasEvents && (
        <div className="self-center text-muted my-auto flex flex-col items-center gap-y-4">
          <Rows3Icon className="size-8" />
          <p className="">Oops! No events found.</p>
        </div>
      )}
    </div>
  )
}

const EventListSkeleton = () => {
  return (
    <div className="flex flex-col gap-y-8">
      {[1, 2, 3].map((groupIdx) => (
        <div key={`skeleton-group-${groupIdx}`} className="flex flex-col gap-y-2 relative">
          <div className="absolute top-2 left-[-59px] rounded-full size-1.5 bg-foreground-muted" />

          <div className="h-6 bg-surface-200 rounded-sm animate-pulse w-64" />

          <div className="flex flex-col gap-y-4">
            {[1, 2, 3, 4].map((eventIdx) => (
              <div
                key={`skeleton-event-${groupIdx}-${eventIdx}`}
                className="bg-surface-100 border rounded-md p-3 flex justify-between items-start"
              >
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-6 bg-surface-200 rounded-sm animate-pulse w-3/4" />

                  <div className="flex gap-2 items-center">
                    <div className="size-5 rounded-full bg-surface-200 animate-pulse" />
                    <div className="h-4 bg-surface-200 rounded-sm animate-pulse w-32" />
                  </div>
                </div>

                <div className="h-6 w-16 bg-surface-200 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
