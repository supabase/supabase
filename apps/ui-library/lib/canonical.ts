import type { Metadata } from 'next'

// Canonicals and social URLs always point at production, even on preview
// deployments, so a preview URL is never indexed in place of the live page.
export const CANONICAL_ORIGIN = 'https://supabase.com'

// The published library URL, regardless of how a deployment routes itself.
// Feeds production canonicals, Open Graph URLs, and JSON-LD.
export const LIBRARY_PATH = '/library'

/** Absolute production URL for a path under the library base path. `path` is relative to it, e.g. `/docs/quickstart`, or '' for the home page. */
export function libraryUrl(path: string): string {
  return `${CANONICAL_ORIGIN}${LIBRARY_PATH}${path}`
}

/** Canonical alternates for a page. `path` is relative to the library base path. */
export function canonicalAlternates(path: string): Metadata['alternates'] {
  return {
    canonical: libraryUrl(path),
  }
}
