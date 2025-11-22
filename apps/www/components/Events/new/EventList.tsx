'use client'

import { Rows3Icon } from 'lucide-react'
import Link from 'next/link'
import { Badge, cn } from 'ui'
import { useEvents } from '~/app/events/context'
import { formatHosts } from '~/lib/eventsUtils'

const CATEGORIES_FILTERS = [
  { name: 'All', value: 'all' },
  { name: 'Meetup', value: 'meetup' },
  { name: 'Workshop', value: 'workshop' },
  { name: 'Hackathon', value: 'hackathon' },
  { name: 'Webinar', value: 'webinar' },
  { name: 'On demand', value: 'on-demand' },
]

export function EventList() {
  const { isLoading, filteredEvents, filteredOnDemandEvents } = useEvents()

  const getCategoryLabel = (value: string) => {
    const category = CATEGORIES_FILTERS.find((cat) => cat.value === value)
    return category?.name || value
  }

  if (isLoading) {
    return <EventListSkeleton />
  }

  // Group upcoming events by date
  const eventsByDate = filteredEvents.reduce(
    (acc, event) => {
      const eventDate = new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      if (!acc[eventDate]) {
        acc[eventDate] = []
      }
      acc[eventDate].push(event)
      return acc
    },
    {} as Record<string, typeof filteredEvents>
  )

  const hasUpcomingEvents = Object.keys(eventsByDate).length > 0
  const hasOnDemandEvents = filteredOnDemandEvents.length > 0

  return (
    <div className="flex flex-col gap-y-8 min-h-72">
      {Object.entries(eventsByDate).map(([date, events], index) => (
        <div key={`group-${date}`} className="flex flex-col gap-y-2 relative">
          <div
            className={cn(
              'absolute top-2 -left-[calc(48px+11px)] rounded-full size-1.5',
              index === 0 ? 'bg-brand size-2 -left-[calc(48px+12px)]' : 'bg-foreground-muted'
            )}
          />

          <h3 className="text-foreground-light font-normal">{date}</h3>

          <div className="flex flex-col gap-y-4">
            {events.map((event, idx) => (
              <div
                key={`${idx}-${event.url}`}
                className="bg-surface-100 border rounded-md p-3 flex justify-between items-start relative"
              >
                <Link
                  className="inset-0 absolute"
                  href={event.url}
                  target={event.url.startsWith('http') ? '_blank' : '_self'}
                  title="Go to event page"
                  aria-hidden
                />

                <div className="flex flex-col gap-2">
                  <h3>{event.title}</h3>

                  <div className="flex gap-2 items-center text-sm text-foreground-light">
                    <div className="size-5 rounded-full border bg-gradient-to-br from-background-surface-100 to-background-surface-200 relative">
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

                {event.categories.map((tag, idx) => (
                  <Badge key={`tag-${idx}`}>{getCategoryLabel(tag)}</Badge>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* On-demand events section */}
      {hasOnDemandEvents && (
        <div className="flex flex-col gap-y-2 relative mt-8">
          <div className="absolute top-2 -left-[calc(48px+11px)] rounded-full size-1.5 bg-foreground-muted" />

          <h3 className="text-foreground-light font-normal">On Demand</h3>

          <div className="flex flex-col gap-y-4">
            {filteredOnDemandEvents.map((event, idx) => (
              <div
                key={`on-demand-${idx}-${event.url}`}
                className="bg-surface-100 border rounded-md p-3 flex justify-between items-start relative"
              >
                <Link
                  className="inset-0 absolute"
                  href={event.url}
                  target={event.url.startsWith('http') ? '_blank' : '_self'}
                  title="Go to event page"
                  aria-hidden
                />

                <div className="flex flex-col gap-2">
                  <h3>{event.title}</h3>

                  <div className="flex gap-2 items-center text-sm text-foreground-light">
                    <div className="size-5 rounded-full border bg-gradient-to-br from-background-surface-100 to-background-surface-200 relative">
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

                {event.categories.map((tag, idx) => (
                  <Badge key={`tag-${idx}`}>{getCategoryLabel(tag)}</Badge>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* empty state */}
      {!hasUpcomingEvents && !hasOnDemandEvents && (
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
          <div className="absolute top-2 -left-[calc(48px+11px)] rounded-full size-1.5 bg-foreground-muted" />

          {/* Date Skeleton */}
          <div className="h-6 bg-surface-200 rounded animate-pulse w-64" />

          <div className="flex flex-col gap-y-4">
            {[1, 2, 3, 4].map((eventIdx) => (
              <div
                key={`skeleton-event-${groupIdx}-${eventIdx}`}
                className="bg-surface-100 border rounded-md p-3 flex justify-between items-start"
              >
                <div className="flex flex-col gap-2 flex-1">
                  {/* Title Skeleton */}
                  <div className="h-6 bg-surface-200 rounded animate-pulse w-3/4" />

                  {/* Host Info Skeleton */}
                  <div className="flex gap-2 items-center">
                    <div className="size-5 rounded-full bg-surface-200 animate-pulse" />
                    <div className="h-4 bg-surface-200 rounded animate-pulse w-32" />
                  </div>
                </div>

                {/* Badge Skeleton */}
                <div className="h-6 w-16 bg-surface-200 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
