/*
 * @file events.ts
 * @description Fetch events from the Notion "Developer Events" database.
 * Only events with "Publish to Web" select set to "Yes" are returned.
 *
 * Notion DB schema (actual column names):
 *   Event Name          -> title
 *   Start Date          -> date
 *   End Date            -> date
 *   Publish to Web      -> select  ("Yes" / other)
 *   Publish to Web Description -> rich_text
 *   URL                 -> rich_text  (event URL)
 *   Book Meeting Link   -> url
 *   Location            -> rich_text
 *   Category            -> multi_select
 *   Are you speaking at this event? -> multi_select
 *   Participation       -> multi_select
 */
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { queryDatabase } from 'lib/notion'

import { EventHost, SUPABASE_HOST, SupabaseEvent } from './eventsTypes'

// The actual DB ID (child database inside the page)
const NOTION_EVENTS_DB_ID_FALLBACK = '21b5004b775f8058872fe8fa81e2c7ac'

// ─── Helpers ────────────────────────────────────────────────────────────────

function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function getTitle(page: any): string {
  const prop = Object.values(page.properties).find((p: any) => p.type === 'title') as any
  return prop?.title?.map((t: any) => t.plain_text).join('') ?? ''
}

function getRichText(page: any, name: string): string {
  const prop = page.properties[name]
  if (!prop || prop.type !== 'rich_text') return ''
  return prop.rich_text.map((t: any) => t.plain_text).join('')
}

function getUrl(page: any, name: string): string {
  const prop = page.properties[name]
  if (!prop || prop.type !== 'url') return ''
  return prop.url ?? ''
}

function getDate(page: any, name: string): string | null {
  const prop = page.properties[name]
  if (!prop || prop.type !== 'date' || !prop.date) return null
  const raw = prop.date.start ?? null
  if (!raw) return null
  // Normalize date-only strings to noon UTC so the event day displays correctly
  // in all timezones (T00:00:00Z rolls back to the previous day for UTC-negative zones)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T12:00:00Z`
  }
  return raw
}

function getMultiSelect(page: any, name: string): string[] {
  const prop = page.properties[name]
  if (!prop || prop.type !== 'multi_select') return []
  return prop.multi_select.map((s: any) => s.name)
}

function getSelect(page: any, name: string): string {
  const prop = page.properties[name]
  if (!prop || prop.type !== 'select') return ''
  return prop.select?.name ?? ''
}

// ─── Main fetch ─────────────────────────────────────────────────────────────

/**
 * Fetch events from Notion where "Publish to Web" select = "Yes".
 * Returns SupabaseEvent objects sorted by start date ascending.
 */
export const getNotionEvents = async (): Promise<SupabaseEvent[]> => {
  const apiKey = process.env.NOTION_EVENTS_API_KEY
  const dbId = process.env.NOTION_EVENTS_DB_ID_ACTUAL ?? NOTION_EVENTS_DB_ID_FALLBACK

  if (!apiKey) {
    console.error('NOTION_EVENTS_API_KEY is not set')
    return []
  }

  try {
    const pages = await queryDatabase(
      dbId,
      apiKey,
      { property: 'Publish to Web', select: { equals: 'Yes' } },
      [{ property: 'Start Date', direction: 'ascending' }]
    )

    return pages
      .map((page): SupabaseEvent | null => {
        const title = getTitle(page)
        const startDate = getDate(page, 'Start Date')
        if (!title || !startDate) return null

        const endDate = getDate(page, 'End Date')
        const description =
          getRichText(page, 'Publish to Web Description') || getRichText(page, 'Notes')
        const rawEventUrl = getRichText(page, 'URL')
        const eventUrl = isSafeHttpUrl(rawEventUrl) ? rawEventUrl : ''
        const rawMeetingLink = getUrl(page, 'Book Meeting Link')
        const meetingLink = isSafeHttpUrl(rawMeetingLink) ? rawMeetingLink : ''
        const location = getRichText(page, 'Location')
        const notionType = getSelect(page, 'Type')
        // "Conference" events are third-party — we attend but don't host, so no
        // "Hosted by" line. "Supabase event" → host = Supabase.
        const isConferenceType = notionType.toLowerCase() === 'conference'
        const categories = ['conference']
        const speakingAnswers = getMultiSelect(page, 'Are you speaking at this event?')
        const isSpeaking = speakingAnswers.includes('Yes')

        return {
          slug: page.id,
          type: 'event',
          title,
          date: startDate,
          end_date: endDate ?? undefined,
          description,
          thumb: '',
          cover_url: page.cover?.external?.url ?? page.cover?.file?.url ?? '',
          path: '',
          url: eventUrl,
          tags: categories,
          categories,
          timezone: '',
          location,
          hosts: isConferenceType ? [] : [SUPABASE_HOST],
          source: 'notion',
          disable_page_build: true,
          isSpeaking,
          meetingLink: meetingLink || undefined,
          link: eventUrl ? { href: eventUrl, target: '_blank' } : undefined,
        }
      })
      .filter((e): e is SupabaseEvent => e !== null)
  } catch (error) {
    console.error('Error fetching Notion events:', error)
    return []
  }
}

// ─── MDX events ─────────────────────────────────────────────────────────────

const EVENTS_DIRECTORY = '_events'
const FILENAME_DATE_PREFIX_LENGTH = 11

type MdxHost = { name?: string; avatar_url?: string }

type MdxFrontmatter = {
  title?: string
  subtitle?: string
  description?: string
  meta_description?: string
  type?: string
  date?: string
  end_date?: string
  timezone?: string
  categories?: string[]
  tags?: string[]
  onDemand?: boolean
  disable_page_build?: boolean
  hosts?: MdxHost[]
  main_cta?: { url?: string; target?: '_blank' | '_self'; label?: string }
}

function mdxSlugFromFilename(filename: string): string {
  // Matches the slug produced by getAllPostSlugs for `_events` (keeps any leading
  // underscore from `YYYY-MM-DD__name.mdx`), so /events/{slug} lands on the built page.
  return filename.replace(/\.mdx$/, '').substring(FILENAME_DATE_PREFIX_LENGTH)
}

function mdxHostsToEventHosts(hosts: MdxHost[] | undefined): EventHost[] {
  if (!hosts || hosts.length === 0) return [SUPABASE_HOST]
  return hosts.map((host, i) => ({
    id: `mdx-host-${i}`,
    email: '',
    name: host.name ?? null,
    first_name: host.name ?? null,
    last_name: null,
    avatar_url: host.avatar_url ?? '',
  }))
}

function startOfTodayUtc(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

/**
 * Read all events under `_events/` and return today-and-future events.
 * Past events are excluded (by end_date when present, otherwise start date).
 */
export const getMdxEvents = (): SupabaseEvent[] => {
  const postDirectory = path.join(process.cwd(), EVENTS_DIRECTORY)

  let fileNames: string[]
  try {
    fileNames = fs.readdirSync(postDirectory)
  } catch (error) {
    console.error('Error reading _events directory:', error)
    return []
  }

  const today = startOfTodayUtc()

  return fileNames
    .filter((filename) => filename.endsWith('.mdx'))
    .map((filename): SupabaseEvent | null => {
      try {
        const fullPath = path.join(postDirectory, filename)
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data } = matter(fileContents) as unknown as { data: MdxFrontmatter }

        if (!data.title || !data.date) return null

        const eventEnd = new Date(data.end_date ?? data.date)
        if (eventEnd < today) return null

        const slug = mdxSlugFromFilename(filename)
        const categories = data.categories ?? (data.type ? [data.type] : [])
        // Webinars don't show a "Hosted by" line — drop hosts entirely.
        const isWebinar = data.type === 'webinar' || categories.includes('webinar')
        const rawCtaUrl = data.main_cta?.url ?? ''
        const isExternalCta = /^https?:\/\//i.test(rawCtaUrl)
        const safeExternalCta = isExternalCta && isSafeHttpUrl(rawCtaUrl) ? rawCtaUrl : ''
        const internalPath = `/events/${slug}`
        const href = safeExternalCta || internalPath
        const target = safeExternalCta ? '_blank' : '_self'

        return {
          slug,
          type: data.type ?? 'event',
          title: data.title,
          date: data.date,
          end_date: data.end_date,
          description: data.meta_description ?? data.description ?? data.subtitle ?? '',
          thumb: '',
          cover_url: '',
          path: internalPath,
          url: href,
          tags: data.tags ?? categories,
          categories,
          timezone: data.timezone ?? '',
          location: '',
          hosts: isWebinar ? [] : mdxHostsToEventHosts(data.hosts),
          source: 'mdx',
          onDemand: data.onDemand,
          disable_page_build: data.disable_page_build,
          link: { href, target, label: data.main_cta?.label },
        }
      } catch (error) {
        console.error(`Error parsing mdx event ${filename}:`, error)
        return null
      }
    })
    .filter((e): e is SupabaseEvent => e !== null)
}
