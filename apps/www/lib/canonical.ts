import type { Metadata } from 'next'

// Canonicals always point at production, even on preview deployments, so a
// preview URL is never indexed in place of the live page.
export const CANONICAL_ORIGIN = 'https://supabase.com'

/** Canonical alternates for an app-router page. `path` must start with `/`. */
export function canonicalAlternates(path: string): Metadata['alternates'] {
  return {
    canonical: `${CANONICAL_ORIGIN}${path}`,
  }
}

/**
 * Canonical href for a pages-router route, from `router.asPath`. Strips query,
 * hash, and trailing slash. Returns undefined for unresolved dynamic routes
 * (e.g. `/changelog/[slug]` before params are known) so a literal `[slug]` is
 * never emitted.
 */
export function getPagesCanonicalHref(asPath: string): string | undefined {
  // Root becomes '' so the canonical is the bare origin, matching the home page.
  const cleanPath = asPath.split('?')[0].split('#')[0].replace(/\/+$/, '')
  if (cleanPath.includes('[')) return undefined
  return `${CANONICAL_ORIGIN}${cleanPath}`
}
