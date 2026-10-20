'use client'

import { posthogClient, useConsentState, useFeatureFlags, useSearchParamsShallow } from 'common'
import { useEffect } from 'react'

import { IA_NAV_FLAG, type IaNavVariant } from './constants'

const VARIANTS: IaNavVariant[] = ['control', 'option-1']

/**
 * Reads the `docs-ia-mvp-v1` PostHog experiment flag.
 * Defaults to `'control'` while the flag store is loading or if the flag is unset,
 * so an unresolved state always falls back to the current navigation.
 */
export function useIaNavVariant(): IaNavVariant {
  const { posthog } = useFeatureFlags()
  const { hasAccepted } = useConsentState()
  const searchParams = useSearchParamsShallow()
  const override = searchParams.get(IA_NAV_FLAG)
  const isOverridden = VARIANTS.includes(override as IaNavVariant)

  const flagValue = posthog[IA_NAV_FLAG]
  const isFlagResolved = flagValue !== undefined
  const flagVariant: IaNavVariant = flagValue === 'option-1' ? 'option-1' : 'control'

  useEffect(() => {
    if (isOverridden || !isFlagResolved) return

    posthogClient.captureExperimentExposure(IA_NAV_FLAG, { variant: flagVariant }, hasAccepted)
  }, [isOverridden, isFlagResolved, flagVariant, hasAccepted])

  if (isOverridden) {
    return override as IaNavVariant
  }

  return flagVariant
}
