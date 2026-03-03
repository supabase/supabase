import { cn } from 'ui'
import { EventGalleryFilters } from './EventGalleryFilters'
import { EventList } from './EventList'
import { EventTimeline } from './EventTimeline'

export function EventGallery() {
  return (
    <section className={cn('grid md:grid-cols-[minmax(320px,35%),16px,1fr] gap-12')}>
      <div className="sticky top-16 md:top-24 py-4 bg-background self-start z-10">
        <EventGalleryFilters />
      </div>
      <EventTimeline />
      <EventList />
    </section>
  )
}
