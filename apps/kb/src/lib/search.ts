import type { DocsSearchV2Result } from 'common/hooks/useDocsSearchV2'

import { BASE_PATH } from './constants'

// api/search is a Vercel function on the same site, so a path works in production and previews.
// `astro dev` doesn't serve it: when developing, point PUBLIC_KB_SEARCH_URL at a deployed
// instance (CORS is open). The override is compiled out of production builds.
export const KB_SEARCH_URL =
  (import.meta.env.DEV && import.meta.env.PUBLIC_KB_SEARCH_URL) || `${BASE_PATH}/api/search`

/**
 * Reshapes one row of `api/search`'s response (`KbSearchResult`) into what the search
 * components render. `path` keeps the base path, since links are plain anchors with no router
 * to add it. Module scope on purpose: the hook restarts its debounce if this changes identity.
 */
export function reshapeKbResult(row: unknown): DocsSearchV2Result | null {
  if (typeof row !== 'object' || row === null) return null
  if (
    !(
      'href' in row &&
      typeof row.href === 'string' &&
      'title' in row &&
      'heading' in row &&
      'excerpt' in row &&
      'score' in row
    )
  )
    return null

  const title = row.title as string
  const headingPath =
    'headingPath' in row && Array.isArray(row.headingPath) && row.headingPath.length > 0
      ? (row.headingPath as string[])
      : [title]

  return {
    // origin is dropped so previews and local runs link to themselves, not to production
    path: new URL(row.href, 'https://supabase.com').pathname,
    title,
    heading: row.heading as string,
    excerpt: row.excerpt as string,
    headingPath,
    score: row.score as number,
  }
}
