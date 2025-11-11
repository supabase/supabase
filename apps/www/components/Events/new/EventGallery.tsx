import { cn } from 'ui'
import { EventGalleryFilters } from './EventGalleryFilters'
import { EventList } from './EventList'
import { EventTimeline } from './EventTimeline'

export function EventGallery() {
  return (
    <section className={cn('grid grid-cols-[minmax(320px,35%),16px,1fr] gap-12')}>
      <EventGalleryFilters />
      <EventTimeline />
      <EventList />
    </section>
  )
}
