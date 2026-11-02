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
 *   Type                -> multi_select  (drives the site's category filter)
 *   Category            -> multi_select  (audience taxonomy)
 *   Are you speaking at this event? -> multi_select
 *   Participation       -> multi_select
 */
import fs from 'fs'
import path from 'path'
import * as Sentry from '@sentry/nextjs'
import type { LumaPayloadEvent, LumaTag } from '~/app/api-v2/luma-events/route'
import matter from 'gray-matter'
import { queryDatabase } from 'lib/notion'

import { EventHost, SUPABASE_HOST, SupabaseEvent } from './eventsTypes'

// The actual DB ID (child database inside the page)
const NOTION_EVENTS_DB_ID_FALLBACK = '21b5004b775f8058872fe8fa81e2c7ac'

// Maps Notion "Type" options to the app's category vocabulary (the values in
// CATEGORIES_FILTERS). Keys are lowercased for case-insensitive matching.
// "Supabase Event", "Party" and "Sales Event" have no filter bucket and fall
// through to DEFAULT_NOTION_CATEGORY.
const NOTION_TYPE_CATEGORY_MAP: Record<string, string> = {
  conference: 'conference',
  hackathon: 'hackathon',
  meetup: 'meetup',
  'meetup - third party': 'meetup',
}

const DEFAULT_NOTION_CATEGORY = 'conference'

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

/**
 * Derive the site's category values for a Notion event.
 *
 * "Type" is the primary signal. "Category" is an audience taxonomy (AI / ML,
 * Postgres / Databases, …) that also carries a "Hackathon" option, so it's read
 * as a secondary signal for events typed as something else — e.g. a third-party
 * meetup that is really a hackathon.
 */
function getNotionCategories(page: any): string[] {
  const mapped = getMultiSelect(page, 'Type')
    .map((type) => NOTION_TYPE_CATEGORY_MAP[type.trim().toLowerCase()])
    .filter(Boolean)

  const isHackathonCategory = getMultiSelect(page, 'Category').some(
    (category) => category.trim().toLowerCase() === 'hackathon'
  )
  if (isHackathonCategory) mapped.push('hackathon')

  return mapped.length > 0 ? Array.from(new Set(mapped)) : [DEFAULT_NOTION_CATEGORY]
}

function getFormulaString(page: any, name: string): string {
  const prop = page.properties[name]
  if (!prop || prop.type !== 'formula' || prop.formula?.type !== 'string') return ''
  return prop.formula.string ?? ''
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
        const title = getFormulaString(page, 'Publish to Web Title') || getTitle(page)
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
        const categories = getNotionCategories(page)
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
          // Notion events are third-party — Supabase attends but does not host,
          // so no "Hosted by" line. Only Luma events are Supabase-hosted.
          hosts: [],
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

interface LumaResponse {
  entries: { event: LumaPayloadEvent; tags?: (string | LumaTag)[] }[]
  has_more: boolean
  next_cursor?: string
}

export async function fetchLumaCalendar(
  apiKey: string,
  after: string | null,
  before: string | null
) {
  const lumaUrl = new URL('https://public-api.lu.ma/public/v1/calendar/list-events')
  if (after) lumaUrl.searchParams.append('after', after)
  if (before) lumaUrl.searchParams.append('before', before)

  const response = await fetch(lumaUrl.toString(), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-luma-api-key': apiKey,
    },
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error(`Luma API error: ${response.status} ${response.statusText}`)
  }

  const data: LumaResponse = await response.json()

  return data.entries
    .filter(({ event }) => event.visibility === 'public')
    .map(({ event, tags }) => ({
      id: event.api_id,
      tags: (tags ?? [])
        .map((tag) => (typeof tag === 'string' ? tag : tag?.name))
        .filter((name): name is string => Boolean(name)),
      start_at: event.start_at,
      end_at: event.end_at,
      name: event.name,
      city: event.geo_address_json?.city,
      country: event.geo_address_json?.country,
      url: event.url,
      timezone: event.timezone,
      cover_url: event.cover_url,
      description: event.description,
      hosts: event.hosts || [],
    }))
}

// Maps Luma event tags to the app's category vocabulary. Keys are lowercased
// for case-insensitive matching against the tag names returned by Luma.
const LUMA_TAG_CATEGORY_MAP: Record<string, string> = {
  hackathons: 'hackathon',
  meetups: 'meetup',
  events: 'conference',
}

export const getLumaEvents = async (): Promise<SupabaseEvent[]> => {
  const apiKey = process.env.LUMA_API_KEY

  if (!apiKey) {
    console.error('LUMA_API_KEY is not set')
    return []
  }

  try {
    const lumaEvents = await fetchLumaCalendar(apiKey, new Date().toISOString(), null)

    return lumaEvents.map((event): SupabaseEvent => {
      const mappedCategories = event.tags
        .map((tag) => LUMA_TAG_CATEGORY_MAP[tag.trim().toLowerCase()])
        .filter(Boolean)
      const categories =
        mappedCategories.length > 0 ? Array.from(new Set(mappedCategories)) : ['conference']
      const safeUrl = isSafeHttpUrl(event.url) ? event.url : undefined

      return {
        slug: '',
        type: 'event',
        title: event.name || '',
        date: event.start_at || '',
        description: event.description || '',
        thumb: '',
        cover_url: event.cover_url || '',
        path: '',
        url: safeUrl ?? '',
        tags: categories,
        categories,
        timezone: event.timezone || 'America/Los_Angeles',
        location: new Intl.ListFormat('en', { style: 'narrow', type: 'unit' }).format(
          [event.city, event.country].filter(Boolean)
        ),
        // All Luma events are Supabase-hosted regardless of which calendar they're from.
        hosts: [SUPABASE_HOST],
        source: 'luma',
        disable_page_build: true,
        link: safeUrl ? { href: safeUrl, target: '_blank' } : undefined,
      }
    })
  } catch (error) {
    Sentry.captureException(error)
    console.error('Error fetching Luma events:', error)
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

function readMdxEventFilenames(): string[] {
  const postDirectory = path.join(process.cwd(), EVENTS_DIRECTORY)
  try {
    return fs.readdirSync(postDirectory).filter((filename) => filename.endsWith('.mdx'))
  } catch (error) {
    console.error('Error reading _events directory:', error)
    return []
  }
}

function mdxFileToEvent(filename: string): SupabaseEvent | null {
  try {
    const fullPath = path.join(process.cwd(), EVENTS_DIRECTORY, filename)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data } = matter(fileContents) as unknown as { data: MdxFrontmatter }

    if (!data.title || !data.date) return null

    const slug = mdxSlugFromFilename(filename)
    const categories = data.categories ?? (data.type ? [data.type] : [])
    // Webinars don't show a "Hosted by" line — drop hosts entirely.
    const isWebinar = data.type === 'webinar' || categories.includes('webinar')
    const rawCtaUrl = data.main_cta?.url ?? ''
    const isExternalCta = /^https?:\/\//i.test(rawCtaUrl)
    const safeExternalCta = isExternalCta && isSafeHttpUrl(rawCtaUrl) ? rawCtaUrl : ''
    const internalPath = `/events/${slug}`
    const href = data.disable_page_build ? safeExternalCta || internalPath : internalPath
    const target = data.disable_page_build && safeExternalCta ? '_blank' : '_self'

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
}

let parsedMdxEventsCache: SupabaseEvent[] | null = null

/** Parse every `_events/*.mdx` file once per process and reuse the result. */
function getAllParsedMdxEvents(): SupabaseEvent[] {
  if (parsedMdxEventsCache) return parsedMdxEventsCache
  parsedMdxEventsCache = readMdxEventFilenames()
    .map(mdxFileToEvent)
    .filter((e): e is SupabaseEvent => e !== null)
  return parsedMdxEventsCache
}

/**
 * Read all events under `_events/` and return today-and-future events.
 * Past events are excluded (by end_date when present, otherwise start date).
 * Events already flipped to `onDemand: true` are excluded too — they've
 * already happened and belong in the on-demand bucket (getOnDemandMdxEvents),
 * not the upcoming one, regardless of how their UTC-converted date compares to today.
 */
export const getMdxEvents = (): SupabaseEvent[] => {
  const today = startOfTodayUtc()
  return getAllParsedMdxEvents().filter(
    (event) => !event.onDemand && new Date(event.end_date ?? event.date) >= today
  )
}

/** All MDX events with `onDemand: true`, including past recordings. */
export const getOnDemandMdxEvents = (): SupabaseEvent[] => {
  return getAllParsedMdxEvents().filter((event) => event.onDemand === true)
}
