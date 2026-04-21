import type { Metadata } from 'next'
import { getNotionEvents } from '~/lib/events'
import { EventClientRenderer } from '~/components/Events/new/EventClientRenderer'

export const metadata: Metadata = {
  title: 'View all Supabase events and meetups.',
  description:
    'Find all the upcoming events, webinars and meetups hosted by supabase and its community.',
}

export default async function EventsPage() {
  const notionEvents = await getNotionEvents()

  return <EventClientRenderer notionEvents={notionEvents} />
}
