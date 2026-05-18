'use client'

import { useEvents } from '~/app/events/context'
import { SearchIcon } from 'lucide-react'
import { Badge, Input } from 'ui'

const CATEGORIES_FILTERS = [
  { name: 'All', value: 'all' },
  { name: 'Conference', value: 'conference' },
  { name: 'Community Event', value: 'community' },
  { name: 'Meetup', value: 'meetup' },
  { name: 'Workshop', value: 'workshop' },
  { name: 'Hackathon', value: 'hackathon' },
  { name: 'Webinar', value: 'webinar' },
]

export function EventGalleryFilters() {
  const { searchQuery, setSearchQuery, selectedCategories, toggleCategory, categories } =
    useEvents()

  return (
    <div className="flex flex-col gap-y-4">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-[9px] size-4 text-foreground-muted" />
        <Input
          placeholder="Search events"
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES_FILTERS.map((category) => {
          const count = categories[category.value] || 0
          const isActive = selectedCategories.includes(category.value)

          return (
            <Badge
              key={category.value}
              variant={isActive ? 'success' : 'default'}
              className="cursor-pointer"
              onClick={() => toggleCategory(category.value)}
            >
              {category.name} ({count})
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
