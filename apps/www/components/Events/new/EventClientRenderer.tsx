import { cn } from 'ui'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { getStaticEvents } from '~/lib/events'
import { SupabaseEvent } from '~/lib/eventsTypes'
import { EventBanner } from '~/components/Events/new/EventBanner'
import { EventsProvider } from '~/app/events/context'
import { EventGallery } from './EventGallery'

export function EventClientRenderer({
  staticEvents,
  onDemandEvents,
}: {
  staticEvents: SupabaseEvent[]
  onDemandEvents: SupabaseEvent[]
}) {
  return (
    <EventsProvider staticEvents={staticEvents} onDemandEvents={onDemandEvents}>
      <DefaultLayout className="flex flex-col">
        <SectionContainer className="border-x border-b !py-8">
          <h1 className="h3 !p-0 !m-0">
            <span className="sr-only">Supabase</span> Events
          </h1>
          <p className="text-foreground-light">Join us at the following upcoming events</p>
        </SectionContainer>

        <SectionContainer className="border-x border-b flex-1 !py-8">
          <EventBanner />
        </SectionContainer>

        <SectionContainer className="border-x flex-1 !pt-8">
          <EventGallery />
        </SectionContainer>
      </DefaultLayout>
    </EventsProvider>
  )
}
