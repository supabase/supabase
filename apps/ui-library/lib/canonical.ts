import type { Metadata } from 'next'

// Canonicals and social URLs always point at production, even on preview
// deployments, so a preview URL is never indexed in place of the live page.
export const CANONICAL_ORIGIN = 'https://supabase.com'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/library'

/** Absolute production URL for a path under the library base path. `path` is relative to it, e.g. `/docs/quickstart`, or '' for the home page. */
export function libraryUrl(path: string): string {
  return `${CANONICAL_ORIGIN}${BASE_PATH}${path}`
}

/** Canonical alternates for a page. `path` is relative to the library base path. */
export function canonicalAlternates(path: string): Metadata['alternates'] {
  return {
    canonical: libraryUrl(path),
  }
}
