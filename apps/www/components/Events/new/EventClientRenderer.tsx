'use client'

import { EventsProvider, useEvents } from '~/app/events/context'
import { EventBanner } from '~/components/Events/new/EventBanner'
import DefaultLayout from '~/components/Layouts/Default'
import { SupabaseEvent } from '~/lib/eventsTypes'
import { ArrowRightIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'

import { EventGallery } from './EventGallery'
import { EventsContainer } from './EventsContainer'
import { OnDemandWebinars } from './OnDemandWebinars'

function EventBannerSection() {
  const { isLoading, featuredEvent, pastWebinars } = useEvents()
  if (isLoading) {
    return (
      <EventsContainer className="border-x border-b flex-1 py-8 bg-surface-200">
        <EventBanner />
      </EventsContainer>
    )
  }
  if (featuredEvent) {
    return (
      <EventsContainer className="border-x border-b flex-1 py-8 bg-surface-200">
        <EventBanner />
      </EventsContainer>
    )
  }

  // Fallback hero when there are no upcoming events.
  return (
    <EventsContainer className="border-x border-b flex-1 py-8 bg-surface-200">
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 py-6">
        <div className="flex flex-col gap-2 max-w-xl">
          <h2 className="text-2xl font-medium">No upcoming events right now</h2>
          <p className="text-foreground-light">
            We're between events at the moment. In the meantime, catch up on our on-demand webinars
            below.
          </p>
        </div>
        {pastWebinars.length > 0 && (
          <Button size="medium" asChild iconRight={<ArrowRightIcon size={14} />}>
            <Link href="#on-demand-webinars">Watch on-demand</Link>
          </Button>
        )}
      </section>
    </EventsContainer>
  )
}

function OnDemandWebinarsSection() {
  const { pastWebinars, isLoading } = useEvents()
  if (isLoading || pastWebinars.length === 0) return null

  return (
    <>
      <EventsContainer className="border-x border-b py-8" id="on-demand-webinars">
        <h2 className="h3 p-0! m-0!">On-demand webinars</h2>
        <p className="text-foreground-light">
          Catch up on past webinars and recorded sessions, available to watch any time.
        </p>
      </EventsContainer>
      <EventsContainer className="border-x border-b py-8">
        <OnDemandWebinars />
      </EventsContainer>
    </>
  )
}

export function EventClientRenderer({
  notionEvents,
  mdxEvents,
}: {
  notionEvents: SupabaseEvent[]
  mdxEvents: SupabaseEvent[]
}) {
  return (
    <EventsProvider notionEvents={notionEvents} mdxEvents={mdxEvents}>
      <DefaultLayout className="flex flex-col">
        <EventsContainer className="border-x border-b py-8">
          <h1 className="h3 p-0! m-0!">
            <span className="sr-only">Supabase</span> Events
          </h1>
          <p className="text-foreground-light">Join us at the following upcoming events</p>
        </EventsContainer>

        <EventBannerSection />

        <EventsContainer className="border-x border-b flex-1 py-8 min-h-[600px] flex flex-col">
          <EventGallery />
        </EventsContainer>

        <OnDemandWebinarsSection />
      </DefaultLayout>
    </EventsProvider>
  )
}
