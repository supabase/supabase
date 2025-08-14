import type { getSortedPosts } from 'lib/posts'
export default interface PostTypes {
  type: 'casestudy' | 'blog' | 'event'
  slug?: string
  title: string
  name?: string
  date: string
  formattedDate?: string
  coverImage?: string
  author?: string
  excerpt?: string
  ogImage?: {
    url: string
  }
  content?: string
  thumb: string
  image?: string
  readingTime?: string
  description: string
  url: string
  path: string
  tags?: string[]
  categories?: string[]
  industry?: string[]
  supabase_products?: string[]
  company_size?: string
  region?: string
  logo?: string
  logo_inverse?: string
  hideAuthor?: boolean
  end_date?: string // for events that span multiple days (not implemented yet)
  timezone?: string // utc timezone, e.g. 'America/New_York'. Reference: /apps/studio/components/interfaces/Database/Backups/PITR/PITR.constants.ts
  onDemand?: boolean // events that are on-demand following a registration process
  disable_page_build?: boolean // when true, we don't build the page and require a custom link
  link?: {
    href: string
    target?: '_blank' | '_self'
    label?: string
  } // used on event previews to link to a custom event page
  isCMS?: boolean
}

export type Event = {
  slug: string
  source: string
  content: any
}

type EventType = 'webinar' | 'meetup' | 'conference' | 'talk' | 'hackathon' | 'launch_week'

type CTA = {
  url: string
  label?: string
  disabled_label?: string
  disabled?: boolean
  target?: '_blank' | '_self'
}

type CompanyType = {
  name: string
  website_url: string
  logo: string
  logo_light: string
}

export type StaticAuthor = {
  author: string
  author_image_url: string | null
  author_url: string
  position: string
}

export type CMSAuthor = {
  author: string
  author_image_url: {
    url: string
  }
  author_url: string
  position: string
}

export type Tag =
  | string
  | {
      name: string
      id: number
      documentId: string
      createdAt: string
      updatedAt: string
      publishedAt: string
    }

export type Category = string | { name: string }

// Add a new type for processed blog data
export type ProcessedBlogData = EventData & {
  needsSerialization?: boolean
}

export interface EventData {
  title: string
  subtitle?: string
  main_cta?: CTA
  description: string
  type: EventType
  company?: CompanyType
  onDemand?: boolean
  disable_page_build?: boolean
  duration?: string
  timezone?: string
  tags?: string[]
  date: string
  end_date?: string
  speakers: string
  speakers_label?: string
  og_image?: string
  thumb?: string
  thumb_light?: string
  youtubeHero?: string
  author_url?: string
  launchweek?: number | string
  meta_title?: string
  meta_description?: string
  video?: string
  isCMS?: boolean
}

export type PostReturnType = ReturnType<typeof getSortedPosts>[number]
