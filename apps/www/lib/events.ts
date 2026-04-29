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
import { queryDatabase } from 'lib/notion'

import { SUPABASE_HOST, SupabaseEvent } from './eventsTypes'

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
          hosts: [SUPABASE_HOST],
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
