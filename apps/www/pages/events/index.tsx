import { useState } from 'react'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'

import { getSortedPosts } from '~/lib/posts'

import { cn } from 'ui'
import DefaultLayout from '~/components/Layouts/Default'
import EventListItem from '~/components/Events/EventListItem'
import EventsFilters from '~/components/Events/EventsFilters'
import SectionContainer from '~/components/Layouts/SectionContainer'

import type BlogPost from '~/types/post'

interface Props {
  events: BlogPost[]
  onDemandEvents: BlogPost[]
  categories: { [key: string]: number }
}

function Events({ events: allEvents, onDemandEvents, categories }: Props) {
  const [events, setEvents] = useState(allEvents)
  const router = useRouter()

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
                .map((event: BlogPost, idx: number) => (
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
  const allEvents = getSortedPosts({
    directory: '_events',
    runner: '** EVENTS PAGE **',
  }) as BlogPost[]
  const upcomingEvents = allEvents.filter((event: BlogPost) => new Date(event.date!) >= new Date())
  const onDemandEvents = allEvents.filter(
    (event: BlogPost) => new Date(event.date!) < new Date() && event.onDemand === true
  )

  const categories = upcomingEvents.reduce(
    (acc: { [key: string]: number }, event: BlogPost) => {
      // Increment the 'all' counter
      acc.all = (acc.all || 0) + 1

      // Increment the counter for each category
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

export default Events
