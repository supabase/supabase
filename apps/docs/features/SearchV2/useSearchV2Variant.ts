'use client'

import { useFeatureFlags, useSearchParamsShallow } from 'common'

import { SEARCH_V2_FLAG, type SearchV2Variant } from './constants'

const VARIANTS: SearchV2Variant[] = ['control', 'search-v2-active']

/**
 * Reads the `docs-search-v2` PostHog experiment flag.
 * Defaults to `'control'` while the flag store is loading or if the flag is unset,
 * so an unresolved state always falls back to the current search experience.
 *
 * Local dev only: `?docs-search-v2=search-v2-active` (or `=control`) forces the variant,
 * for testing without a live PostHog/platform connection. Disabled outside `next dev`.
 */
export function useSearchV2Variant(): SearchV2Variant {
  const { posthog } = useFeatureFlags()
  const searchParams = useSearchParamsShallow()

  if (process.env.NODE_ENV !== 'production') {
    const override = searchParams.get(SEARCH_V2_FLAG)
    if (VARIANTS.includes(override as SearchV2Variant)) {
      return override as SearchV2Variant
    }
  }

  return posthog[SEARCH_V2_FLAG] === 'search-v2-active' ? 'search-v2-active' : 'control'
}
