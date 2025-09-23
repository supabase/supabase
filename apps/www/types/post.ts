import type { getSortedPosts } from 'lib/posts'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'

export interface PostTypes {
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
  author_image_url:
    | {
        url: string
      }
    | string
    | null
  author_url: string
  position: string
}

export type Blog = {
  slug: string
  title: string
  description?: string
  content: MDXRemoteSerializeResult
  toc: string | { content: string }
  author?: string
  authors?: (CMSAuthor | StaticAuthor)[]
  date: string
  categories?: string[]
  tags?:
    | string[]
    | Array<{
        id: number
        documentId: string
        name: string
        createdAt: string
        updatedAt: string
        publishedAt: string
      }>
  toc_depth?: number
  video?: string
  docs_url?: string
  blog_url?: string
  url?: string
  source: string
  image?: string
  thumb?: string
  youtubeHero?: string
  launchweek?: number | string
  meta_title?: string
  meta_description?: string
  meta_image?: string
  isCMS?: boolean
}

export type BlogData = {
  slug: string
  title: string
  description?: string
  content: MDXRemoteSerializeResult
  toc: string | { content: string }
  author?: string
  authors?: (CMSAuthor | StaticAuthor)[]
  date: string
  categories?: string[]
  tags?:
    | string[]
    | Array<{
        id: number
        documentId: string
        name: string
        createdAt: string
        updatedAt: string
        publishedAt: string
      }>
  toc_depth?: number
  docs_url?: string
  blog_url?: string
  url?: string
  source: string
  image?: string
  thumb?: string
  youtubeHero?: string
  launchweek?: number | string
  meta_title?: string
  meta_description?: string
  meta_image?: string
  video?: string
  isCMS?: boolean
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
export type ProcessedBlogData = Blog &
  BlogData & {
    needsSerialization?: boolean
  }

export type ProcessedEventData = EventData & {
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

export interface CMSPostTypes extends PostTypes {
  isCMS?: boolean
  authors?: Array<{
    author: string
    author_id: string
    position: string
    author_url: string
    author_image_url: {
      url: string
    }
    username: string
  }>
}

export type PostReturnType = ReturnType<typeof getSortedPosts>[number]

export default PostTypes
