import { cn } from 'ui'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { getStaticEvents } from '~/lib/events'
import { EventsProvider } from './context'
import { EventBanner } from '~/components/Events/new/EventBanner'
import { EventClientRenderer } from '~/components/Events/new/EventClientRenderer'

export default async function EventsPage() {
  // This needs to be server-side as we use FS api.
  const staticEvents = await getStaticEvents()

  return <EventClientRenderer staticEvents={staticEvents.upcomingEvents} />
}
