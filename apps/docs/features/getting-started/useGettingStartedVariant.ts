'use client'

import {
  posthogClient,
  useConsentState,
  useFeatureFlags,
  useMountEffect,
  useSearchParamsShallow,
} from 'common'
import { useEffect, useState } from 'react'

type GettingStartedVariant = (typeof VARIANTS)[number]

// PostHog multivariate flag for the getting started stepper
const GETTING_STARTED_FLAG = 'docs-getting-started-v2'

const VARIANTS = ['control', 'stepper'] as const

const isVariant = (value: unknown): value is GettingStartedVariant =>
  VARIANTS.some((variant) => variant === value)

// `?docs-getting-started-v2=stepper` forces a variant and records no exposure
export const useGettingStartedVariant = (): {
  variant: GettingStartedVariant
  isReady: boolean
} => {
  const { posthog, hasLoaded } = useFeatureFlags()
  const { hasAccepted } = useConsentState()
  const override = useSearchParamsShallow().get(GETTING_STARTED_FLAG)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  const flagValue = posthog[GETTING_STARTED_FLAG]
  // `false` means the visitor is outside the rollout, not assigned to control
  const isAssigned = isVariant(flagValue)
  const flagVariant: GettingStartedVariant = flagValue === 'stepper' ? 'stepper' : 'control'

  // flags may never load, so the page shows after a second
  useMountEffect(() => {
    const timer = setTimeout(() => setHasTimedOut(true), 1000)
    return () => clearTimeout(timer)
  })

  // exception: the flag store resolves without an event to hook
  useEffect(() => {
    if (!isAssigned) return
    // useSearchParamsShallow is empty until its own effect runs, so read the URL directly
    const urlOverride = new URLSearchParams(window.location.search).get(GETTING_STARTED_FLAG)
    if (isVariant(urlOverride)) return

    posthogClient.captureExperimentExposure(
      GETTING_STARTED_FLAG,
      { variant: flagVariant },
      hasAccepted
    )
  }, [isAssigned, flagVariant, hasAccepted])

  return {
    variant: isVariant(override) ? override : flagVariant,
    isReady: isVariant(override) || Boolean(hasLoaded) || hasTimedOut,
  }
}
