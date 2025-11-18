import { cn } from 'ui'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { getStaticEvents } from '~/lib/events'
import { SupabaseEvent } from '~/lib/eventsTypes'
import { EventBanner } from '~/components/Events/new/EventBanner'
import { EventsProvider } from '~/app/events/context'
import { EventGallery } from './EventGallery'

export function EventClientRenderer({ staticEvents }: { staticEvents: SupabaseEvent[] }) {
  return (
    <EventsProvider staticEvents={staticEvents}>
      <DefaultLayout className="flex flex-col">
        <SectionContainer className="border-x border-b lg:!py-12">
          <h1 className="h1">
            <span className="sr-only">Supabase</span> Events
          </h1>
          <p className="text-foreground-light">Join us at the following upcoming events</p>
        </SectionContainer>

        <SectionContainer className="border-x flex-1 lg:!pt-12">
          <EventBanner />
        </SectionContainer>

        <SectionContainer className="border-x flex-1 !pt-0">
          <EventGallery />
        </SectionContainer>
      </DefaultLayout>
    </EventsProvider>
  )
}
