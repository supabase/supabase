import 'server-only'

import * as Sentry from '@sentry/nextjs'
import { supabaseAdmin } from '~/lib/supabaseAdmin'

/**
 * PostgREST returns at most 1,000 rows per request by default, so the table
 * is read in pages of this size.
 */
const PAGE_SIZE = 1000

/**
 * Upper bound on the whole paginated read. Guide pages wait on this lookup, so
 * a stalled database must fall back to rendering without a date instead of
 * holding up static generation.
 */
const LOOKUP_TIMEOUT_MS = 30_000

/**
 * Reads every guide row from `last_changed` and reduces them to one date per
 * page: the newest `last_updated` across that page's section rows.
 */
async function fetchAllPageDates() {
  const dates = new Map<string, string>()
  // One deadline shared by every page, so the total wait is bounded
  const signal = AbortSignal.timeout(LOOKUP_TIMEOUT_MS)

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabaseAdmin()
      .from('last_changed')
      .select('id, parent_page, last_updated')
      .like('parent_page', '/content/guides/%')
      .order('id', { ascending: true })
      .abortSignal(signal)
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error

    for (const row of data) {
      const current = dates.get(row.parent_page)
      if (!current || Date.parse(row.last_updated) > Date.parse(current)) {
        dates.set(row.parent_page, row.last_updated)
      }
    }

    if (data.length < PAGE_SIZE) break
  }

  return dates
}

/**
 * Builds map of all pages and then reads from this, so the table is read once per worker
 * rather than once per page. A failed load is not cached, so the next call retries.
 */
let pageDates: Promise<Map<string, string>> | undefined

function loadPageDates() {
  pageDates ??= fetchAllPageDates().catch((error) => {
    Sentry.captureException(error)
    pageDates = undefined
    return new Map<string, string>()
  })

  return pageDates
}

/**
 * Returns the most recent content change for a guide page, as recorded in the
 * `last_changed` table by `scripts/last-changed.ts`.
 *
 * Returns `undefined` when the page has no rows or the table could not be
 * read, so the page renders without a date rather than failing.
 */
export async function getGuideLastUpdated(slug: string[]): Promise<string | undefined> {
  const dates = await loadPageDates()

  return dates.get(`/content/guides/${slug.join('/')}.mdx`)
}
