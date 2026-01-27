import type { Metadata } from 'next'

import { EventClientRenderer } from '~/components/Events/new/EventClientRenderer'
import { getStaticEvents } from '~/lib/events'

export const metadata: Metadata = {
  title: 'View all Supabase events and meetups.',
  description:
    'Find all the upcoming events, webinars and meetups hosted by supabase and its community.',
}

export default async function EventsPage() {
  // This needs to be server-side as we use FS api.
  const { upcomingEvents, onDemandEvents } = await getStaticEvents()

  return <EventClientRenderer staticEvents={upcomingEvents} onDemandEvents={onDemandEvents} />
}
