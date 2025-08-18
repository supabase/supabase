'use client'

import { useEffect, useMemo, useState } from 'react'
import DefaultLayout from 'components/Layouts/Default'
import EventsFilters from 'components/Events/EventsFilters'
import SectionContainer from 'components/Layouts/SectionContainer'
import { cn } from 'ui'
import EventListItem from 'components/Events/EventListItem'

type Props = {
  staticEvents: any[]
  onDemandEvents: any[]
  categories: { [key: string]: number }
}

export default function EventsClient({
  staticEvents,
  onDemandEvents,
  categories: staticCategories,
}: Props) {
  const [lumaEvents, setLumaEvents] = useState<any[]>([])
  const [events, setEvents] = useState(staticEvents)

  useEffect(() => {
    const fetchLumaEvents = async () => {
      try {
        const afterDate = new Date().toISOString()
        const url = new URL('/api-v2/luma-events', window.location.origin)
        url.searchParams.append('after', afterDate)

        const res = await fetch(url.toString())
        const data = await res.json()

        if (data.success) {
          const transformed = data.events.map((event: any) => {
            let categories: string[] = []
            if (event.name.toLowerCase().includes('meetup')) categories.push('meetup')
            return {
              slug: '',
              type: 'event',
              title: event?.name,
              date: event?.start_at,
              description: '',
              thumb: '',
              path: '',
              url: event?.url ?? '',
              tags: categories,
              categories,
              timezone: event?.timezone ?? 'America/Los_Angeles',
              disable_page_build: true,
              link: {
                href: event?.url ?? '#',
                target: '_blank',
              },
            }
          })
          setLumaEvents(transformed)
        }
      } catch {
        // ignore
      }
    }

    fetchLumaEvents()
  }, [])

  const allEvents = useMemo(() => {
    const combined = [...staticEvents, ...lumaEvents]
    return combined.filter((event: any) =>
      event.end_date ? new Date(event.end_date!) >= new Date() : new Date(event.date!) >= new Date()
    )
  }, [staticEvents, lumaEvents])

  useEffect(() => {
    setEvents(allEvents)
  }, [allEvents])

  const categories = useMemo(() => {
    const updated = { ...staticCategories }
    lumaEvents.forEach((event) => {
      updated.all = (updated.all || 0) + 1
      event.categories?.forEach((category: string) => {
        updated[category] = (updated[category] || 0) + 1
      })
    })
    return updated
  }, [staticCategories, lumaEvents])

  return (
    <DefaultLayout className="min-h-[80dvh]">
      <SectionContainer className="!py-8 lg:!py-16">
        <h1 className="h1">
          <span className="sr-only">Supabase</span> Events
        </h1>
        <p className="text-foreground-light">Join us at the following upcoming events</p>
      </SectionContainer>
      <SectionContainer className="!py-0">
        <EventsFilters
          allEvents={allEvents}
          events={events}
          setEvents={setEvents}
          categories={categories}
        />

        <ol
          className={cn(
            'grid -mx-2 sm:-mx-4 py-6 lg:py-6 grid-cols-1',
            !events?.length && 'mx-0 sm:mx-0'
          )}
        >
          {events?.length ? (
            events
              ?.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
              .map((event: any, idx: number) => (
                <div
                  className="col-span-12 px-2 sm:px-4 [&_a]:last:border-none opacity-0 !scale-100 animate-fade-in"
                  key={`${event.title}-upcoming-${idx}`}
                >
                  <EventListItem event={event} />
                </div>
              ))
          ) : (
            <p className="text-sm py-2 sm:py-4 text-lighter col-span-full italic opacity-0 !scale-100 animate-fade-in">
              No results found
            </p>
          )}
        </ol>
      </SectionContainer>
      <SectionContainer>
        <div className="pt-8 border-t">
          <h2 className="h3">On Demand</h2>
          <p className="text-foreground-light">Replay selected events on your schedule</p>
        </div>
        <ol
          className={cn(
            'grid -mx-2 sm:-mx-4 py-6 lg:py-6',
            'grid-cols-12 lg:gap-4',
            !onDemandEvents?.length && 'mx-0 sm:mx-0'
          )}
        >
          {onDemandEvents?.length ? (
            onDemandEvents?.map((event: any, idx: number) => (
              <div
                className="col-span-12 px-2 sm:px-4 [&_a]:last:border-none opacity-0 !scale-100 animate-fade-in"
                key={`${event.title}-upcoming-${idx}`}
              >
                <EventListItem event={event} />
              </div>
            ))
          ) : (
            <p className="text-sm py-2 sm:py-4 text-lighter col-span-full italic opacity-0 !scale-100 animate-fade-in">
              No results found
            </p>
          )}
        </ol>
      </SectionContainer>
    </DefaultLayout>
  )
}
