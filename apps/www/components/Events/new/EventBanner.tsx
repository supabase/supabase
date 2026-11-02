'use client'

import { useEvents } from '~/app/events/context'
import { formatHosts } from '~/lib/eventsUtils'
import { ArrowRightIcon, CalendarIcon, MapPinIcon, VideoIcon } from 'lucide-react'
import Link from 'next/link'
import { Badge, Button } from 'ui'

export function EventBanner() {
  const { featuredEvent, displayTimeZone } = useEvents()

  if (!featuredEvent) return null

  return (
    <section className="flex flex-col gap-6 rounded-lg py-6">
      <article className="flex flex-col md:flex-row md:items-stretch gap-8 lg:py-2">
        <div className="flex flex-col gap-6 flex-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-medium lg:line-clamp-2">{featuredEvent.title}</h2>
              {featuredEvent.isSpeaking && (
                <Badge variant="success" className="flex items-center gap-1 shrink-0">
                  Speaking
                </Badge>
              )}
            </div>
            {featuredEvent.hosts.length > 0 && (
              <p
                className="text-lg font-medium text-foreground-light"
                title={`Hosted by ${formatHosts(featuredEvent.hosts).fullList}`}
              >
                {formatHosts(featuredEvent.hosts).displayText}
              </p>
            )}
          </div>

          <p className="text-foreground-light line-clamp-3 lg:line-clamp-4">
            {featuredEvent.description}
          </p>
        </div>

        <div className="flex flex-col justify-between gap-8">
          <div className="flex flex-row gap-6">
            <DateWidget
              date={featuredEvent.date}
              endDate={featuredEvent.end_date}
              displayTimeZone={displayTimeZone}
            />
            <LocationWidget
              location={featuredEvent.location}
              categories={featuredEvent.categories}
            />
          </div>

          <div className="flex items-center md:justify-end gap-2">
            {featuredEvent.meetingLink && (
              <Button variant="secondary" size="medium" asChild>
                <Link href={featuredEvent.meetingLink} target="_blank" rel="noopener noreferrer">
                  Meet with us
                </Link>
              </Button>
            )}
            {featuredEvent.link && (
              <Button
                variant="primary"
                size="medium"
                asChild
                iconRight={<ArrowRightIcon size={14} />}
              >
                <Link
                  href={featuredEvent.link.href}
                  target={featuredEvent.link.target}
                  rel="noopener noreferrer"
                >
                  Register
                </Link>
              </Button>
            )}
          </div>
        </div>
      </article>
    </section>
  )
}

const DateWidget = ({
  date,
  endDate,
  displayTimeZone,
}: {
  date: string
  endDate?: string
  displayTimeZone: 'UTC' | undefined
}) => {
  const eventDate = new Date(date)
  // Date-only Notion events are normalized to noon UTC (T12:00:00Z); detect them
  // so we can display in UTC and suppress the fabricated time component.
  const isDateOnly = date.endsWith('T12:00:00Z')
  const eventTimeZone = isDateOnly ? 'UTC' : displayTimeZone

  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: eventTimeZone,
  })

  const currentYear = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    timeZone: displayTimeZone,
  })
  const eventYear = eventDate.toLocaleDateString('en-US', {
    year: 'numeric',
    timeZone: eventTimeZone,
  })
  const formattedDateWithYear =
    eventYear !== currentYear ? `${formattedDate}, ${eventYear}` : formattedDate

  const timeFormat = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: displayTimeZone,
    timeZoneName: displayTimeZone ? 'short' : undefined,
  } as const

  // Only show time for events that have a real time component
  let timeDisplay: string | null = null
  if (!isDateOnly) {
    const startTime = eventDate.toLocaleTimeString('en-US', timeFormat)

    if (endDate && !endDate.endsWith('T12:00:00Z')) {
      const endEventDate = new Date(endDate)
      const endTime = endEventDate.toLocaleTimeString('en-US', timeFormat)
      timeDisplay = `${startTime} - ${endTime}`
    } else {
      timeDisplay = startTime
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="bg-surface-100 w-10 h-10 flex items-center justify-center border rounded-md">
        <CalendarIcon className="size-5" strokeWidth={1.5} />
      </div>

      <div className="flex flex-col gap-0">
        <p>{formattedDateWithYear}</p>
        {timeDisplay && <p className="text-foreground-light text-sm">{timeDisplay}</p>}
      </div>
    </div>
  )
}

const LocationWidget = ({ location, categories }: { location?: string; categories?: string[] }) => {
  // Webinars have no physical location; show a camera icon and the format instead.
  if (categories?.includes('webinar')) {
    return (
      <div className="flex items-center gap-4">
        <div className="bg-surface-100 w-10 h-10 flex items-center justify-center border rounded-md">
          <VideoIcon className="size-5" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col gap-0">
          <p>Supabase Live</p>
        </div>
      </div>
    )
  }

  const hasLocation = location && location.length > 0
  const locationText = hasLocation ? location : 'Unknown'

  return (
    <div className="flex items-center gap-4">
      <div className="bg-surface-100 w-10 h-10 flex items-center justify-center border rounded-md">
        <MapPinIcon className="size-5" strokeWidth={1.5} />
      </div>

      <div className="flex flex-col gap-0">
        <p>Hosted at</p>
        <p className="text-foreground-light text-sm">{locationText}</p>
      </div>
    </div>
  )
}
