'use client'

import { posthogClient, useConsentState, useFeatureFlags, useSearchParamsShallow } from 'common'
import { useEffect } from 'react'

import { IA_NAV_FLAG, type IaNavVariant } from './constants'

const VARIANTS: IaNavVariant[] = ['control', 'option-1']

const isVariant = (value: unknown): value is IaNavVariant =>
  VARIANTS.includes(value as IaNavVariant)

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

  const flagValue = posthog[IA_NAV_FLAG]
  // `false` means the visitor is outside the rollout, not assigned to control.
  const isAssigned = isVariant(flagValue)
  const flagVariant: IaNavVariant = flagValue === 'option-1' ? 'option-1' : 'control'

  useEffect(() => {
    if (!isAssigned) return
    // useSearchParamsShallow is empty until its own effect runs, so read the URL directly.
    const urlOverride = new URLSearchParams(window.location.search).get(IA_NAV_FLAG)
    if (isVariant(urlOverride)) return

    posthogClient.captureExperimentExposure(IA_NAV_FLAG, { variant: flagVariant }, hasAccepted)
  }, [isAssigned, flagVariant, hasAccepted])

  return isVariant(override) ? override : flagVariant
}
