'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { SupabaseEvent, SUPABASE_HOST } from '~/lib/eventsTypes'

interface EventsContextValue {
  // Events data
  allEvents: SupabaseEvent[]
  filteredEvents: SupabaseEvent[]
  filteredOnDemandEvents: SupabaseEvent[]
  staticEvents: SupabaseEvent[]
  onDemandEvents: SupabaseEvent[]
  lumaEvents: SupabaseEvent[]
  featuredEvent: SupabaseEvent | undefined

  // Loading states
  isLoading: boolean

  // Search & Filter
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategories: string[]
  toggleCategory: (category: string) => void

  // Categories
  categories: { [key: string]: number }
}

const EventsContext = createContext<EventsContextValue | undefined>(undefined)

interface EventsProviderProps {
  children: ReactNode
  staticEvents: SupabaseEvent[]
  onDemandEvents: SupabaseEvent[]
}

export function EventsProvider({ children, staticEvents, onDemandEvents }: EventsProviderProps) {
  const [lumaEvents, setLumaEvents] = useState<SupabaseEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])

  useEffect(() => {
    const fetchLumaEvents = async () => {
      try {
        setIsLoading(true)

        const afterDate = new Date().toISOString()
        const url = new URL('/api-v2/luma-events', window.location.origin)
        url.searchParams.append('after', afterDate)

        const res = await fetch(url.toString())
        const data = await res.json()

        if (data.success) {
          const transformedEvents: SupabaseEvent[] = data.events.map((event: any) => {
            let categories = []
            const isMeetup = event.name.toLowerCase().includes('meetup')
            if (isMeetup) categories.push('meetup')

            return {
              slug: '',
              type: 'event',
              title: event?.name || '',
              date: event?.start_at || '',
              description: event?.description || '',
              thumb: '',
              cover_url: event?.cover_url || '',
              path: '',
              url: event?.url || '',
              tags: categories,
              categories,
              timezone: event?.timezone || 'America/Los_Angeles',
              location: new Intl.ListFormat('en', { style: 'narrow', type: 'unit' }).format(
                [event?.city, event?.country].filter(Boolean)
              ),
              hosts: isMeetup || event?.hosts?.length === 0 ? [SUPABASE_HOST] : event?.hosts || [],
              source: 'luma',
              disable_page_build: true,
              link: {
                href: event?.url || '#',
                target: '_blank',
              },
            }
          })
          setLumaEvents(transformedEvents)
        }
      } catch (error) {
        console.error('Error fetching Luma events:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLumaEvents()
  }, [])

  // Merge all events (static + luma)
  const allEvents = useMemo(() => {
    return [...staticEvents, ...lumaEvents]
  }, [staticEvents, lumaEvents])

  // Calculate categories with counts
  // - Webinar: count only upcoming webinars (not on-demand)
  // - On-demand: count only on-demand events
  const categories = useMemo(() => {
    const categoryCounts: { [key: string]: number } = { all: 0 }

    // Count upcoming events (excluding on-demand)
    allEvents.forEach((event) => {
      categoryCounts.all += 1

      event.categories?.forEach((category) => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      })
    })

    // Count on-demand events separately
    onDemandEvents.forEach((event) => {
      categoryCounts.all += 1
      // Add to 'on-demand' category instead of 'webinar'
      categoryCounts['on-demand'] = (categoryCounts['on-demand'] || 0) + 1
    })

    return categoryCounts
  }, [allEvents, onDemandEvents])

  // Toggle category selection
  const toggleCategory = (category: string) => {
    if (category === 'all') {
      setSelectedCategories(['all'])
      return
    }

    setSelectedCategories((prev) => {
      // Remove 'all' if selecting a specific category
      const withoutAll = prev.filter((c) => c !== 'all')

      // Toggle the category
      if (withoutAll.includes(category)) {
        const updated = withoutAll.filter((c) => c !== category)
        // If no categories selected, default to 'all'
        return updated.length === 0 ? ['all'] : updated
      } else {
        return [...withoutAll, category]
      }
    })
  }

  // Filter upcoming events by search query and category
  const filteredEvents = useMemo(() => {
    // If 'on-demand' is selected, don't show upcoming events
    if (selectedCategories.includes('on-demand') && !selectedCategories.includes('all')) {
      return []
    }

    let filtered = allEvents

    // Filter by categories (multiple selection)
    if (!selectedCategories.includes('all')) {
      filtered = filtered.filter((event) =>
        event.categories?.some((cat) => selectedCategories.includes(cat))
      )
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((event) => {
        const titleMatch = event.title?.toLowerCase().includes(query)
        const descriptionMatch = event.description?.toLowerCase().includes(query)
        const locationMatch = event.location?.toLowerCase().includes(query)
        const tagsMatch = event.tags?.some((tag) => tag.toLowerCase().includes(query))

        return titleMatch || descriptionMatch || locationMatch || tagsMatch
      })
    }

    // Sort by date (upcoming events first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })
  }, [allEvents, selectedCategories, searchQuery])

  // Filter on-demand events separately by search query and category
  const filteredOnDemandEvents = useMemo(() => {
    // If specific categories are selected (not 'all' and not 'on-demand'), don't show on-demand events
    if (!selectedCategories.includes('all') && !selectedCategories.includes('on-demand')) {
      return []
    }

    let filtered = onDemandEvents

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((event) => {
        const titleMatch = event.title?.toLowerCase().includes(query)
        const descriptionMatch = event.description?.toLowerCase().includes(query)
        const locationMatch = event.location?.toLowerCase().includes(query)
        const tagsMatch = event.tags?.some((tag) => tag.toLowerCase().includes(query))

        return titleMatch || descriptionMatch || locationMatch || tagsMatch
      })
    }

    return filtered
  }, [onDemandEvents, selectedCategories, searchQuery])

  // Featured event: nearest upcoming event, or if none, the most recent past event
  const featuredEvent = useMemo(() => {
    if (allEvents.length === 0) return undefined

    const now = new Date()

    // Separate upcoming and past events
    const upcomingEvents = allEvents.filter((event) => {
      const eventDate = new Date(event.end_date || event.date)
      return eventDate >= now
    })

    const pastEvents = allEvents.filter((event) => {
      const eventDate = new Date(event.end_date || event.date)
      return eventDate < now
    })

    // If there are upcoming events, return the nearest one
    if (upcomingEvents.length > 0) {
      return upcomingEvents.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateA - dateB
      })[0]
    }

    // If no upcoming events, return the most recent past event
    if (pastEvents.length > 0) {
      return pastEvents.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA // Descending order for past events
      })[0]
    }

    return undefined
  }, [allEvents, isLoading])

  const value: EventsContextValue = {
    allEvents,
    filteredEvents,
    filteredOnDemandEvents,
    staticEvents,
    onDemandEvents,
    lumaEvents,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategories,
    toggleCategory,
    categories,
    featuredEvent,
  }

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}

export function useEvents() {
  const context = useContext(EventsContext)
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider')
  }
  return context
}
