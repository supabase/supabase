'use client'

import { useEvents } from '~/app/events/context'
import { formatHosts } from '~/lib/eventsUtils'
import { ArrowRightIcon, CalendarIcon, MapPinIcon } from 'lucide-react'
import Link from 'next/link'
import { Badge, Button } from 'ui'

export function EventBanner() {
  const { isLoading, featuredEvent } = useEvents()

  if (isLoading) {
    return <EventBannerSkeleton />
  }

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
            <p
              className="text-lg font-medium text-foreground-light"
              title={`Hosted by ${formatHosts(featuredEvent.hosts).fullList}`}
            >
              {formatHosts(featuredEvent.hosts).displayText}
            </p>
          </div>

          <p className="text-foreground-light line-clamp-3 lg:line-clamp-4">
            {featuredEvent.description}
          </p>
        </div>

        <div className="flex flex-col justify-between gap-8">
          <div className="flex flex-row gap-6">
            <DateWidget date={featuredEvent.date} endDate={featuredEvent.end_date} />
            <LocationWidget location={featuredEvent.location} />
          </div>

          <div className="flex items-center md:justify-end gap-2">
            {featuredEvent.meetingLink && (
              <Button type="secondary" size="medium" asChild>
                <Link href={featuredEvent.meetingLink} target="_blank" rel="noopener noreferrer">
                  Meet with us
                </Link>
              </Button>
            )}
            {featuredEvent.link && (
              <Button size="medium" asChild iconRight={<ArrowRightIcon size={14} />}>
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

const DateWidget = ({ date, endDate }: { date: string; endDate?: string }) => {
  const eventDate = new Date(date)
  // Date-only Notion events are normalized to noon UTC (T12:00:00Z); detect them
  // so we can display in UTC and suppress the fabricated time component.
  const isDateOnly = date.endsWith('T12:00:00Z')
  const tzOption = isDateOnly ? ({ timeZone: 'UTC' } as const) : {}

  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    ...tzOption,
  })

  const currentYear = new Date().getFullYear()
  const eventYear = isDateOnly ? parseInt(date.slice(0, 4), 10) : eventDate.getFullYear()
  const formattedDateWithYear =
    eventYear !== currentYear ? `${formattedDate}, ${eventYear}` : formattedDate

  // Only show time for events that have a real time component
  let timeDisplay: string | null = null
  if (!isDateOnly) {
    const startTime = eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    if (endDate && !endDate.endsWith('T12:00:00Z')) {
      const endEventDate = new Date(endDate)
      const endTime = endEventDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
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

const LocationWidget = ({ location }: { location?: string }) => {
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

const EventBannerSkeleton = () => {
  return (
    <section className="flex flex-col gap-6 rounded-lg p-6">
      <article className="flex flex-col md:flex-row md:items-stretch gap-6 lg:py-2">
        {/* Left: title + host + description */}
        <div className="flex flex-col gap-6 flex-1">
          <div className="flex flex-col gap-1.5">
            <div className="h-8 bg-surface-200 rounded-sm animate-pulse w-3/4" />
            <div className="h-5 bg-surface-200 rounded-sm animate-pulse w-1/2 mt-1" />
          </div>
          <div className="h-16 bg-surface-200 rounded-sm animate-pulse w-full" />
        </div>

        {/* Right: widgets top, button bottom */}
        <div className="flex flex-col justify-between gap-6">
          <div className="flex flex-row gap-6">
            {/* Date Widget Skeleton */}
            <div className="flex items-center gap-4">
              <div className="bg-surface-200 w-10 h-10 rounded-md animate-pulse" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-32 bg-surface-200 rounded-sm animate-pulse" />
                <div className="h-3 w-20 bg-surface-200 rounded-sm animate-pulse" />
              </div>
            </div>
            {/* Location Widget Skeleton */}
            <div className="flex items-center gap-4">
              <div className="bg-surface-200 w-10 h-10 rounded-md animate-pulse" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-20 bg-surface-200 rounded-sm animate-pulse" />
                <div className="h-3 w-24 bg-surface-200 rounded-sm animate-pulse" />
              </div>
            </div>
          </div>

          {/* Button Skeleton */}
          <div className="flex justify-end">
            <div className="h-9 w-24 bg-surface-200 rounded-sm animate-pulse" />
          </div>
        </div>
      </article>
    </section>
  )
}
