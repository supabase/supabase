'use client'

import { posthogClient, useConsentState, useFeatureFlags, useSearchParamsShallow } from 'common'
import { useEffect } from 'react'

import { SEARCH_V2_FLAG, type SearchV2Variant } from './constants'

const VARIANTS: SearchV2Variant[] = ['control', 'search-v2-active']

/**
 * Reads the `docs-search-v2` PostHog experiment flag.
 * Defaults to `'control'` while the flag store is loading or if the flag is unset,
 * so an unresolved state always falls back to the current search experience.
 */
export function useSearchV2Variant(): SearchV2Variant {
  const { posthog } = useFeatureFlags()
  const { hasAccepted } = useConsentState()
  const searchParams = useSearchParamsShallow()
  const override = searchParams.get(SEARCH_V2_FLAG)
  const isOverridden = VARIANTS.includes(override as SearchV2Variant)

  const flagValue = posthog[SEARCH_V2_FLAG]
  const isFlagResolved = flagValue !== undefined
  const flagVariant: SearchV2Variant =
    flagValue === 'search-v2-active' ? 'search-v2-active' : 'control'

  useEffect(() => {
    if (isOverridden || !isFlagResolved) return

    posthogClient.captureExperimentExposure(SEARCH_V2_FLAG, { variant: flagVariant }, hasAccepted)
  }, [isOverridden, isFlagResolved, flagVariant, hasAccepted])

  if (isOverridden) {
    return override as SearchV2Variant
  }

  return flagVariant
}
