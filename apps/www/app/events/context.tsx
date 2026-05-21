'use client'

import { SUPABASE_HOST, SupabaseEvent } from '~/lib/eventsTypes'
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'

interface EventsContextValue {
  allEvents: SupabaseEvent[]
  filteredEvents: SupabaseEvent[]
  pastWebinars: SupabaseEvent[]
  featuredEvent: SupabaseEvent | undefined
  isLoading: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategories: string[]
  toggleCategory: (category: string) => void
  categories: { [key: string]: number }
}

const EventsContext = createContext<EventsContextValue | undefined>(undefined)

interface EventsProviderProps {
  children: ReactNode
  notionEvents: SupabaseEvent[]
  mdxEvents: SupabaseEvent[]
}

export function EventsProvider({ children, notionEvents, mdxEvents }: EventsProviderProps) {
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
            // Categorize by the originating Luma calendar: events from the
            // Supabase Hackathons calendar → `hackathon`; everything from the
            // Supabase Community Events calendar → `community`.
            const categories: string[] = [
              event?.calendar === 'hackathon' ? 'hackathon' : 'community',
            ]

            const rawUrl = event?.url || ''
            let safeUrl: string | undefined
            try {
              const parsed = new URL(rawUrl)
              if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                safeUrl = rawUrl
              }
            } catch {
              // invalid URL
            }

            return {
              slug: '',
              type: 'event',
              title: event?.name || '',
              date: event?.start_at || '',
              description: event?.description || '',
              thumb: '',
              cover_url: event?.cover_url || '',
              path: '',
              url: safeUrl ?? '',
              tags: categories,
              categories,
              timezone: event?.timezone || 'America/Los_Angeles',
              location: new Intl.ListFormat('en', { style: 'narrow', type: 'unit' }).format(
                [event?.city, event?.country].filter(Boolean)
              ),
              // All Luma events are Supabase-hosted regardless of which calendar they're from.
              hosts: [SUPABASE_HOST],
              source: 'luma' as const,
              disable_page_build: true,
              link: safeUrl ? { href: safeUrl, target: '_blank' as const } : undefined,
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

  // Merge Notion (server) + mdx (server) + Luma (client) events.
  const allEvents = useMemo(
    () => [...notionEvents, ...mdxEvents, ...lumaEvents],
    [notionEvents, mdxEvents, lumaEvents]
  )

  const startOfToday = useMemo(() => {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  }, [])

  // Today-or-future events drive the main listing, filters, and hero.
  const upcomingEvents = useMemo(
    () =>
      allEvents.filter((event) => {
        const eventDate = new Date(event.end_date || event.date)
        return eventDate >= startOfToday
      }),
    [allEvents, startOfToday]
  )

  // Past webinars become on-demand content. Sort newest first.
  const pastWebinars = useMemo(
    () =>
      allEvents
        .filter((event) => {
          const eventDate = new Date(event.end_date || event.date)
          if (eventDate >= startOfToday) return false
          return event.type === 'webinar' || event.categories?.includes('webinar')
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [allEvents, startOfToday]
  )

  const categories = useMemo(() => {
    const counts: { [key: string]: number } = { all: 0 }

    upcomingEvents.forEach((event) => {
      counts.all += 1
      event.categories?.forEach((category) => {
        counts[category] = (counts[category] || 0) + 1
      })
    })

    return counts
  }, [upcomingEvents])

  const toggleCategory = (category: string) => {
    if (category === 'all') {
      setSelectedCategories(['all'])
      return
    }

    setSelectedCategories((prev) => {
      const withoutAll = prev.filter((c) => c !== 'all')

      if (withoutAll.includes(category)) {
        const updated = withoutAll.filter((c) => c !== category)
        return updated.length === 0 ? ['all'] : updated
      } else {
        return [...withoutAll, category]
      }
    })
  }

  const filteredEvents = useMemo(() => {
    let filtered = upcomingEvents

    if (!selectedCategories.includes('all')) {
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
      return dateA - dateB
    })
  }, [upcomingEvents, selectedCategories, searchQuery])

  const featuredEvent = useMemo(() => {
    if (upcomingEvents.length === 0) return undefined

    return [...upcomingEvents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )[0]
  }, [upcomingEvents])

  const value: EventsContextValue = {
    allEvents,
    filteredEvents,
    pastWebinars,
    featuredEvent,
    isLoading,
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
