import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'

import { getSortedPosts } from 'lib/posts'
import supabase from 'lib/supabase'

import { cn } from 'ui'
import DefaultLayout from 'components/Layouts/Default'
import EventListItem from 'components/Events/EventListItem'
import EventsFilters from 'components/Events/EventsFilters'
import SectionContainer from 'components/Layouts/SectionContainer'

import type BlogPost from 'types/post'
import type { LumaEvent } from 'app/api-v2/luma-events/route'

interface Props {
  events: BlogPost[]
  onDemandEvents: BlogPost[]
  categories: { [key: string]: number }
}

export default function Events({
  events: staticEvents,
  onDemandEvents,
  categories: staticCategories,
}: Props) {
  const [lumaEvents, setLumaEvents] = useState<BlogPost[]>([])
  const [isLoadingLuma, setIsLoadingLuma] = useState(true)
  const [filteredEvents, setFilteredEvents] = useState<BlogPost[]>([])
  const router = useRouter()

  // Fetch Luma events on client-side to avoid serverless maximum size limit error: https://vercel.com/guides/troubleshooting-function-250mb-limit
  useEffect(() => {
    const fetchLumaEvents = async () => {
      try {
        const afterDate = new Date().toISOString()
        const url = new URL('/api-v2/luma-events', window.location.origin)
        url.searchParams.append('after', afterDate)

        const res = await fetch(url.toString())
        const data = await res.json()

        if (data.success) {
          const transformedEvents = data.events.map((event: LumaEvent) => {
            let categories = []
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
            } as BlogPost
          })
          setLumaEvents(transformedEvents)
        }
      } catch (error) {
        console.error('Error fetching Luma events:', error)
      } finally {
        setIsLoadingLuma(false)
      }
    }

    fetchLumaEvents()
  }, [])

  // Combine static and Luma events
  const allEvents = useMemo(() => {
    const combined = [...staticEvents, ...lumaEvents]
    return combined.filter((event: BlogPost) =>
      event.end_date ? new Date(event.end_date!) >= new Date() : new Date(event.date!) >= new Date()
    )
  }, [staticEvents, lumaEvents])

  // Initialize filtered events when allEvents changes
  useEffect(() => {
    setFilteredEvents(allEvents)
  }, [allEvents])

  // Recalculate categories with Luma events included
  const categories = useMemo(() => {
    const updatedCategories = { ...staticCategories }

    lumaEvents.forEach((event) => {
      updatedCategories.all = (updatedCategories.all || 0) + 1

      event.categories?.forEach((category) => {
        updatedCategories[category] = (updatedCategories[category] || 0) + 1
      })
    })

    return updatedCategories
  }, [staticCategories, lumaEvents])

  const meta_title = 'Supabase Events: webinars, talks, hackathons, and meetups'
  const meta_description = 'Join Supabase and the open-source community at the upcoming events.'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/${router.pathname}`,
          images: [
            {
              url: `https://supabase.com/images/og/supabase-og.png`,
            },
          ],
        }}
        additionalLinkTags={[
          {
            rel: 'alternate',
            type: 'application/rss+xml',
            href: `https://supabase.com/rss.xml`,
          },
        ]}
      />
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
            onDemandEvents={onDemandEvents}
            events={filteredEvents}
            setEvents={setFilteredEvents}
            categories={categories}
          />
          <div
            className={cn(
              'grid -mx-2 sm:-mx-4 py-6 lg:py-6 grid-cols-1',
              !filteredEvents?.length && 'mx-0 sm:mx-0'
            )}
          >
            {filteredEvents?.length ? (
              filteredEvents
                ?.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
                .map((event: BlogPost, idx: number) => (
                  <div
                    className="col-span-12 px-2 sm:px-4 [&_a]:last:border-none opacity-0 !scale-100 animate-fade-in"
                    key={`${event.title}-upcoming-${idx}`}
                  >
                    <EventListItem event={event} />
                  </div>
                ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                {isLoadingLuma ? (
                  <div className="text-center">
                    <p className="text-foreground-muted">Loading events...</p>
                  </div>
                ) : (
                  <p className="text-foreground-muted">No results found.</p>
                )}
              </div>
            )}
          </div>
        </SectionContainer>
        <SectionContainer id="on-demand">
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
              onDemandEvents?.map((event: BlogPost, idx: number) => (
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
    </>
  )
}

export async function getStaticProps() {
  const { data: meetups, error } = await supabase
    .from('meetups')
    .select('id, city, country, link, start_at, timezone, launch_week')
    .eq('is_published', true)

  if (error) console.log('meetups error: ', error)

  const meetupEvents: BlogPost[] =
    meetups?.map((meetup: any) => ({
      slug: '',
      type: 'event',
      title: `Launch Week ${meetup.launch_week.slice(2)} Meetup: ${meetup.city}, ${meetup.country}`,
      date: meetup.start_at,
      description: '',
      thumb: '',
      path: '',
      url: meetup.link ?? '',
      tags: ['meetup', 'launch-week'],
      categories: ['meetup'],
      timezone: meetup.timezone ?? 'America/Los_Angeles',
      disable_page_build: true,
      link: {
        href: meetup.link ?? '#',
        target: '_blank',
      },
    })) ?? []

  const staticEvents = getSortedPosts({
    directory: '_events',
    runner: '** EVENTS PAGE **',
  }) as BlogPost[]

  const allEvents = [...staticEvents, ...meetupEvents]
  const upcomingEvents = allEvents.filter((event: BlogPost) =>
    event.end_date ? new Date(event.end_date!) >= new Date() : new Date(event.date!) >= new Date()
  )
  const onDemandEvents = allEvents.filter(
    (event: BlogPost) => new Date(event.date!) < new Date() && event.onDemand === true
  )

  const categories = upcomingEvents.reduce(
    (acc: { [key: string]: number }, event: BlogPost) => {
      acc.all = (acc.all || 0) + 1

      event.categories?.forEach((category) => {
        acc[category] = (acc[category] || 0) + 1
      })

      return acc
    },
    { all: 0 }
  )

  return {
    props: {
      events: upcomingEvents,
      onDemandEvents,
      categories,
    },
  }
}
