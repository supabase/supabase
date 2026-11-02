'use client'

import { SupabaseEvent } from '~/lib/eventsTypes'
import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'

interface EventsContextValue {
  allEvents: SupabaseEvent[]
  filteredEvents: SupabaseEvent[]
  featuredEvent: SupabaseEvent | undefined
  isHydrated: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategories: string[]
  toggleCategory: (category: string) => void
  categories: { [key: string]: number }
}

const EventsContext = createContext<EventsContextValue | undefined>(undefined)

const subscribeToNothing = () => () => {}

interface EventsProviderProps {
  children: ReactNode
  notionEvents: SupabaseEvent[]
  lumaEvents: SupabaseEvent[]
  mdxEvents: SupabaseEvent[]
  onDemandMdxEvents: SupabaseEvent[]
}

export function EventsProvider({
  children,
  notionEvents,
  lumaEvents,
  mdxEvents,
  onDemandMdxEvents,
}: EventsProviderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  )

  // Merge Notion + mdx + Luma events, showing only today and future.
  const allEvents = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    )
    return [...notionEvents, ...mdxEvents, ...lumaEvents].filter((event) => {
      const eventDate = new Date(event.end_date || event.date)
      return eventDate >= startOfToday
    })
  }, [notionEvents, mdxEvents, lumaEvents])

  const isOnDemandView = selectedCategories.includes('on-demand')

  const categories = useMemo(() => {
    const counts: { [key: string]: number } = { all: 0 }

    allEvents.forEach((event) => {
      counts.all += 1
      event.categories?.forEach((category) => {
        counts[category] = (counts[category] || 0) + 1
      })
    })

    if (onDemandMdxEvents.length > 0) {
      counts['on-demand'] = onDemandMdxEvents.length
    }

    return counts
  }, [allEvents, onDemandMdxEvents.length])

  const toggleCategory = (category: string) => {
    if (category === 'on-demand') {
      setSelectedCategories((prev) => (prev.includes('on-demand') ? ['all'] : ['on-demand']))
      return
    }

    if (category === 'all') {
      setSelectedCategories(['all'])
      return
    }

    setSelectedCategories((prev) => {
      const withoutAll = prev.filter((c) => c !== 'all' && c !== 'on-demand')

      if (withoutAll.includes(category)) {
        const updated = withoutAll.filter((c) => c !== category)
        return updated.length === 0 ? ['all'] : updated
      } else {
        return [...withoutAll, category]
      }
    })
  }

  const filteredEvents = useMemo(() => {
    let filtered = isOnDemandView ? onDemandMdxEvents : allEvents

    if (!isOnDemandView && !selectedCategories.includes('all')) {
      filtered = filtered.filter((event) =>
        event.categories?.some((cat) => selectedCategories.includes(cat))
      )
    }

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

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return isOnDemandView ? dateB - dateA : dateA - dateB
    })
  }, [allEvents, onDemandMdxEvents, isOnDemandView, selectedCategories, searchQuery])

  const featuredEvent = useMemo(() => {
    if (allEvents.length === 0) return undefined

    return [...allEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
  }, [allEvents])

  const value: EventsContextValue = {
    allEvents,
    filteredEvents,
    featuredEvent,
    isHydrated,
    searchQuery,
    setSearchQuery,
    selectedCategories,
    toggleCategory,
    categories,
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
