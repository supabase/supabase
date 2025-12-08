/**
 * @file eventsTypes.ts
 * @description Shared types and constants for events that can be used in both client and server components
 */

/**
 * Host information for events
 */
export interface EventHost {
  id: string
  email: string
  name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string
}

/**
 * Default host for Supabase-hosted events
 */
export const SUPABASE_HOST: EventHost = {
  id: 'supabase',
  email: 'events@supabase.com',
  name: 'Supabase',
  first_name: 'Supabase',
  last_name: null,
  avatar_url: 'https://github.com/supabase.png',
}

/**
 * Unified event interface for all events in the system
 */
export interface SupabaseEvent {
  slug: string
  type: string
  title: string
  date: string
  description: string
  thumb: string
  cover_url: string
  path: string
  url: string
  tags: string[]
  categories: string[]
  timezone: string
  location: string
  hosts: EventHost[]
  source: 'luma' | 'supabase' | 'file'
  end_date?: string
  onDemand?: boolean
  disable_page_build?: boolean
  link?: {
    href: string
    target?: '_blank' | '_self'
    label?: string
  }
}
