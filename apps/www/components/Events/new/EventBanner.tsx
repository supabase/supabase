'use client'

import { CalendarIcon, MapPinIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, Button, Badge } from 'ui'
import { useEvents } from '~/app/events/context'
import { formatHosts } from '~/lib/eventsUtils'

export function EventBanner() {
  const { isLoading, featuredEvent } = useEvents()

  if (isLoading) {
    return <EventBannerSkeleton />
  }

  if (!featuredEvent) return null

  return (
    <section
      className={cn('grid md:grid-cols-[minmax(320px,35%),1fr] items-start gap-6 lg:gap-12')}
    >
      <CoverImage url={featuredEvent.cover_url} />

      <article className="flex flex-col md:justify-center gap-6 lg:py-2">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-medium lg:line-clamp-2">{featuredEvent.title}</h2>
            <p
              className="text-lg font-medium text-foreground-light"
              title={`Hosted by ${formatHosts(featuredEvent.hosts).fullList}`}
            >
              {formatHosts(featuredEvent.hosts).displayText}
            </p>
          </div>

          {featuredEvent.link && (
            <Button className="hidden md:block mt-1" size="medium" asChild>
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

        <div className="flex flex-wrap gap-y-4 gap-x-12 items-center">
          <DateWidget date={featuredEvent.date} endDate={featuredEvent.end_date} />
          <LocationWidget location={featuredEvent.location} />
        </div>

        <div className="relative flex">
          <p className="text-foreground-light line-clamp-3 lg:line-clamp-4">
            {featuredEvent.description}
          </p>
        </div>

        {featuredEvent.link && (
          <Button className="block md:hidden mt-1" size="medium" asChild>
            <Link
              href={featuredEvent.link.href}
              target={featuredEvent.link.target}
              rel="noopener noreferrer"
            >
              Register
            </Link>
          </Button>
        )}
      </article>
    </section>
  )
}

const DateWidget = ({ date, endDate }: { date: string; endDate?: string }) => {
  const eventDate = new Date(date)

  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const currentYear = new Date().getFullYear()
  const eventYear = eventDate.getFullYear()
  const formattedDateWithYear =
    eventYear !== currentYear ? `${formattedDate}, ${eventYear}` : formattedDate

  // Extract start time from the date string
  const startTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  // If there's an end date, format it and show time range
  let timeDisplay = startTime
  if (endDate) {
    const endEventDate = new Date(endDate)
    const endTime = endEventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    timeDisplay = `${startTime} - ${endTime}`
  }

  return (
    <div className="flex items-center gap-4">
      <div className="bg-surface-100 w-10 h-10 flex items-center justify-center border rounded-md">
        <CalendarIcon className="size-5" strokeWidth={1.5} />
      </div>

      <div className="flex flex-col gap-0">
        <p>{formattedDateWithYear}</p>
        <p className="text-foreground-light text-sm">{timeDisplay}</p>
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

const CoverImage = ({ url }: { url?: string }) => {
  if (!url)
    return (
      <div className="w-full bg-surface-100 aspect-square border rounded-lg hidden md:grid place-items-center relative">
        <Logo />
        <Badge variant="success" className="absolute bottom-4 right-4">
          Upcoming
        </Badge>
      </div>
    )

  return (
    <div className="w-full bg-surface-100 hidden md:block aspect-square border rounded-lg overflow-hidden relative">
      <img src={url} alt="Event Cover" className="object-cover object-center w-full" />
      <Badge variant="success" className="absolute bottom-4 right-4">
        Upcoming
      </Badge>
    </div>
  )
}

const Logo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="109"
    height="113"
    fill="none"
    viewBox="0 0 109 113"
  >
    <path
      fill="url(#a)"
      d="M63.708 110.284c-2.86 3.601-8.658 1.628-8.727-2.97l-1.007-67.251h45.22c8.19 0 12.758 9.46 7.665 15.874z"
    ></path>
    <path
      fill="url(#b)"
      fillOpacity="0.2"
      d="M63.708 110.284c-2.86 3.601-8.658 1.628-8.727-2.97l-1.007-67.251h45.22c8.19 0 12.758 9.46 7.665 15.874z"
    ></path>
    <path
      fill="#3ecf8e"
      d="M45.317 2.071c2.86-3.601 8.657-1.628 8.726 2.97l.442 67.251H9.83c-8.19 0-12.759-9.46-7.665-15.875z"
    ></path>
    <defs>
      <linearGradient
        id="a"
        x1="53.974"
        x2="94.163"
        y1="54.974"
        y2="71.829"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#249361"></stop>
        <stop offset="1" stopColor="#3ecf8e"></stop>
      </linearGradient>
      <linearGradient
        id="b"
        x1="36.156"
        x2="54.484"
        y1="30.578"
        y2="65.081"
        gradientUnits="userSpaceOnUse"
      >
        <stop></stop>
        <stop offset="1" stopOpacity="0"></stop>
      </linearGradient>
    </defs>
  </svg>
)

const EventBannerSkeleton = () => {
  return (
    <section className={cn('grid md:grid-cols-[minmax(320px,35%),1fr] gap-12')}>
      {/* Cover Image Skeleton */}
      <div className="w-full bg-surface-200 aspect-square border rounded-lg animate-pulse" />

      <article className="flex flex-col gap-6 py-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1.5 flex-1">
            {/* Title Skeleton */}
            <div className="h-8 bg-surface-200 rounded animate-pulse w-3/4" />
            {/* Host Skeleton */}
            <div className="h-6 bg-surface-200 rounded animate-pulse w-1/2 mt-1" />
          </div>

          {/* Button Skeleton */}
          <div className="hidden md:block mt-1 h-10 w-24 bg-surface-200 rounded animate-pulse" />
        </div>

        <div className="flex flex-wrap gap-y-4 gap-x-12 items-center">
          {/* Date Widget Skeleton */}
          <div className="flex items-center gap-4">
            <div className="bg-surface-200 p-1.5 border rounded-md">
              <div className="size-7 bg-surface-200 rounded animate-pulse" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-5 w-40 bg-surface-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-surface-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Location Widget Skeleton */}
          <div className="flex items-center gap-4">
            <div className="bg-surface-200 p-1.5 border rounded-md">
              <div className="size-7 bg-surface-200 rounded animate-pulse" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-5 w-24 bg-surface-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-surface-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Description Skeleton */}
        <div className="mt-4 space-y-2">
          <div className="h-32 bg-surface-200 rounded animate-pulse w-full" />
        </div>

        {/* Mobile Button Skeleton */}
        <div className="block md:hidden mt-1 h-10 w-full bg-surface-200 rounded animate-pulse" />
      </article>
    </section>
  )
}
