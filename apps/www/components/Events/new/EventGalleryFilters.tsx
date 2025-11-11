import { Input } from '@ui/components/shadcn/ui/input'
import { SearchIcon } from 'lucide-react'
import { Badge } from 'ui'

const CATEGORIES_FILTERS = [
  { name: 'All', value: 'all' },
  { name: 'Meetup', value: 'meetup' },
  { name: 'Workshop', value: 'workshop' },
  { name: 'Hackathon', value: 'hackathon' },
  { name: 'On demand', value: 'on-demand' },
]

export function EventGalleryFilters() {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-[9px] size-4 text-foreground-muted" />
        <Input placeholder="Search events" className="pl-10" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES_FILTERS.map((category) => (
          <Badge key={category.value} variant="default">
            {category.name}
          </Badge>
        ))}
      </div>
    </div>
  )
}
