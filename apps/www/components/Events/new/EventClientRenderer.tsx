'use client'

import { EventsProvider, useEvents } from '~/app/events/context'
import { EventBanner } from '~/components/Events/new/EventBanner'
import DefaultLayout from '~/components/Layouts/Default'
import { SupabaseEvent } from '~/lib/eventsTypes'

import { EventGallery } from './EventGallery'
import { EventsContainer } from './EventsContainer'

function EventBannerSection() {
  const { isLoading, featuredEvent } = useEvents()
  if (!isLoading && !featuredEvent) return null

  return (
    <EventsContainer className="border-x border-b flex-1 py-8 bg-surface-200">
      <EventBanner />
    </EventsContainer>
  )
}

export function EventClientRenderer({ notionEvents }: { notionEvents: SupabaseEvent[] }) {
  return (
    <EventsProvider notionEvents={notionEvents}>
      <DefaultLayout className="flex flex-col">
        <EventsContainer className="border-x border-b py-8">
          <h1 className="h3 p-0! m-0!">
            <span className="sr-only">Supabase</span> Events
          </h1>
          <p className="text-foreground-light">Join us at the following upcoming events</p>
        </EventsContainer>

        <EventBannerSection />

        <EventsContainer className="border-x flex-1 py-8">
          <EventGallery />
        </EventsContainer>
      </DefaultLayout>
    </EventsProvider>
  )
}
