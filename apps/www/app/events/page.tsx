import { EventClientRenderer } from '~/components/Events/new/EventClientRenderer'
import { breadcrumbs } from '~/lib/breadcrumbs'
import { getNotionEvents } from '~/lib/events'
import { breadcrumbListSchema, serializeJsonLd } from '~/lib/json-ld'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'View all Supabase events and meetups.',
  description:
    'Find all the upcoming events, webinars and meetups hosted by supabase and its community.',
}

export default async function EventsPage() {
  const notionEvents = await getNotionEvents()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbListSchema(breadcrumbs.eventsIndex)),
        }}
      />
      <EventClientRenderer notionEvents={notionEvents} />
    </>
  )
}
