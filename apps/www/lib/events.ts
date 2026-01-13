/*
 * @file events.ts
 * @description Unified api to fetch events from Luma and Filesystem.
 */
import supabase from 'lib/supabase'
import { getSortedPosts } from 'lib/posts'
import authors from 'lib/authors.json'
import { EventHost, SUPABASE_HOST, SupabaseEvent } from './eventsTypes'

/**
 * Parse hosts from either a comma-separated string of author IDs or an array of host objects
 * Maps author IDs to EventHost objects using the authors.json file
 */
function parseHostsFromAuthors(
  hostsData?: string | Array<{ name: string; avatar_url?: string | null }>
): EventHost[] {
  if (!hostsData) return [SUPABASE_HOST]

  // Handle array format (new format from MDX files)
  if (Array.isArray(hostsData)) {
    const hosts = hostsData
      .map((host) => {
        // Try to find author by name for additional data
        const author = authors.find((a: any) => a.author === host.name || a.author_id === host.name)

        if (author) {
          return {
            id: (author as any).author_id || host.name,
            email: (author as any).author_url || '',
            name: (author as any).author || host.name,
            first_name: (author as any).author?.split(' ')[0] || host.name?.split(' ')[0] || null,
            last_name:
              (author as any).author?.split(' ').slice(1).join(' ') ||
              host.name?.split(' ').slice(1).join(' ') ||
              null,
            avatar_url: host.avatar_url || (author as any).author_image_url || '',
          }
        }

        // Return host as-is if no author match
        return {
          id: host.name,
          email: '',
          name: host.name,
          first_name: host.name?.split(' ')[0] || null,
          last_name: host.name?.split(' ').slice(1).join(' ') || null,
          avatar_url: host.avatar_url || '',
        }
      })
      .filter((host): host is EventHost => host !== null && host.name !== null)

    return hosts.length > 0 ? hosts : [SUPABASE_HOST]
  }

  // Handle string format (legacy format)
  const hostIds = hostsData.split(',').map((id) => id.trim())
  const hosts = hostIds
    .map((hostId) => {
      const author = authors.find((a: any) => a.author_id === hostId)
      if (!author) return null

      return {
        id: (author as any).author_id || hostId,
        email: (author as any).author_url || '',
        name: (author as any).author || null,
        first_name: (author as any).author?.split(' ')[0] || null,
        last_name: (author as any).author?.split(' ').slice(1).join(' ') || null,
        avatar_url: (author as any).author_image_url || '',
      }
    })
    .filter((host): host is EventHost => host !== null)

  return hosts.length > 0 ? hosts : [SUPABASE_HOST]
}

interface LumaEvent {
  id: string
  name: string
  start_at: string
  end_at: string
  timezone: string
  location: string
  url: string
  hosts: Array<{
    id: string
    email: string
    name: string | null
    first_name: string | null
    last_name: string | null
    avatar_url: string
  }>
}

interface MeetupRecord {
  id: string
  city: string
  country?: string
  link: string
  start_at: string
  timezone: string
  launch_week: string
}

interface EventRecord {
  slug: string
  type: string
  title: string
  date: string
  end_date?: string
  description: string
  thumb: string
  cover_url: string
  path: string
  url: string
  tags?: string[]
  categories?: string[]
  timezone?: string
  location?: string
  onDemand?: boolean
  disable_page_build?: boolean
  link?: {
    href: string
    target?: '_blank' | '_self'
    label?: string
  }
}

/**
 * Get the nearest upcoming event from an array of events
 * Returns the event with the closest date to now that is still in the future
 */
export const getFeaturedEvent = (events: SupabaseEvent[]): SupabaseEvent | null => {
  if (!events || events.length === 0) return null

  const now = new Date()

  // Filter for upcoming events only
  const upcomingEvents = events.filter((event) => {
    const eventDate = new Date(event.end_date || event.date)
    return eventDate >= now
  })

  if (upcomingEvents.length === 0) return null

  // Sort by date ascending and return the nearest one
  const sortedEvents = upcomingEvents.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  return sortedEvents[0]
}

export const getLumaEvents = async (): Promise<SupabaseEvent[]> => {
  try {
    const afterDate = new Date().toISOString()
    const url = new URL('/api-v2/luma-events', window.location.origin)
    url.searchParams.append('after', afterDate)

    const res = await fetch(url.toString())
    const data = await res.json()

    if (data.success) {
      const transformedEvents: SupabaseEvent[] = data.events.map((event: LumaEvent) => {
        let categories = []
        const isMeetup = event.name.toLowerCase().includes('meetup')
        if (isMeetup) categories.push('meetup')

        return {
          slug: '',
          type: 'event',
          title: event?.name || '',
          date: event?.start_at || '',
          description: '',
          thumb: '',
          cover_url: '',
          path: '',
          url: event?.url || '',
          tags: categories,
          categories,
          timezone: event?.timezone || 'America/Los_Angeles',
          location: event?.location || '',
          hosts: isMeetup ? [SUPABASE_HOST] : event?.hosts || [],
          source: 'luma',
          disable_page_build: true,
          link: {
            href: event?.url || '#',
            target: '_blank',
          },
        }
      })
      return transformedEvents
    }

    return []
  } catch (error) {
    console.error('Error fetching Luma events:', error)
    return []
  }
}

export const getStaticEvents = async (): Promise<{
  upcomingEvents: SupabaseEvent[]
  onDemandEvents: SupabaseEvent[]
  categories: { [key: string]: number }
}> => {
  const { data: meetups, error } = await supabase
    .from('meetups')
    .select('id, city, country, link, start_at, timezone, launch_week')
    .eq('is_published', true)

  if (error) console.log('meetups error: ', error)

  const meetupEvents: SupabaseEvent[] =
    meetups?.map((meetup: any) => ({
      slug: '',
      type: 'event',
      title: `Launch Week ${meetup.launch_week.slice(2)} Meetup: ${meetup.city}, ${meetup.country}`,
      date: meetup.start_at,
      description: '',
      thumb: '',
      cover_url: '',
      path: '',
      url: meetup.link || '',
      tags: ['meetup', 'launch-week'],
      categories: ['meetup'],
      timezone: meetup.timezone || 'America/Los_Angeles',
      location: `${meetup.city}, ${meetup.country}`,
      hosts: [SUPABASE_HOST],
      source: 'supabase',
      disable_page_build: true,
      link: {
        href: meetup.link || '#',
        target: '_blank',
      },
    })) ?? []

  const staticEvents = getSortedPosts({
    directory: '_events',
    runner: '** EVENTS PAGE **',
  })

  const allEvents: SupabaseEvent[] = [
    ...staticEvents.map(
      (post): SupabaseEvent => ({
        slug: post.slug || '',
        type: (post as any).type || 'event',
        title: post.title || '',
        date: post.date || '',
        description: post.description || '',
        thumb: post.thumb || '',
        cover_url: (post as any).cover_url || '',
        path: post.path || '',
        // For webinars, use internal path; for other events, use external link if available
        url:
          (post as any).type === 'webinar'
            ? post.url || post.path || ''
            : post.link?.href || post.url || post.path || '',
        tags: post.tags || [],
        categories: post.categories || [],
        timezone: (post as any).timezone || 'America/Los_Angeles',
        location: (post as any).location || '',
        hosts: parseHostsFromAuthors((post as any).hosts),
        source: 'file',
        end_date: (post as any).end_date,
        onDemand: (post as any).onDemand,
        disable_page_build: (post as any).disable_page_build,
        link: (post as any).link,
      })
    ),
    ...meetupEvents,
  ]

  const upcomingEvents = allEvents.filter((event: SupabaseEvent) =>
    event.end_date ? new Date(event.end_date) >= new Date() : new Date(event.date) >= new Date()
  )

  const onDemandEvents = allEvents.filter(
    (event: SupabaseEvent) => new Date(event.date) < new Date() && event.onDemand === true
  )

  const categories = upcomingEvents.reduce(
    (acc: { [key: string]: number }, event: SupabaseEvent) => {
      acc.all = (acc.all || 0) + 1

      event.categories?.forEach((category) => {
        acc[category] = (acc[category] || 0) + 1
      })

      return acc
    },
    { all: 0 }
  )

  return {
    upcomingEvents,
    onDemandEvents,
    categories,
  }
}
