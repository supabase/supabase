import { EventClientRenderer } from '~/components/Events/new/EventClientRenderer'
import { breadcrumbs } from '~/lib/breadcrumbs'
import { getMdxEvents, getNotionEvents, getOnDemandMdxEvents } from '~/lib/events'
import { breadcrumbListSchema, serializeJsonLd } from '~/lib/json-ld'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'View all Supabase events and meetups.',
  description:
    'Find all the upcoming events, webinars and meetups hosted by supabase and its community.',
}

export default async function EventsPage() {
  const [notionEvents, mdxEvents, onDemandMdxEvents] = await Promise.all([
    getNotionEvents(),
    Promise.resolve(getMdxEvents()),
    Promise.resolve(getOnDemandMdxEvents()),
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbListSchema(breadcrumbs.eventsIndex)),
        }}
      />
      <EventClientRenderer
        notionEvents={notionEvents}
        mdxEvents={mdxEvents}
        onDemandMdxEvents={onDemandMdxEvents}
      />
    </>
  )
}
