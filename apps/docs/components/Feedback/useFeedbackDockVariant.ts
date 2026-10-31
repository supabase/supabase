'use client'

import { posthogClient, useConsentState, useFeatureFlags, useSearchParamsShallow } from 'common'
import { useMountEffect } from 'common/hooks/useMountEffect'
import { useEffect, useState } from 'react'

export type FeedbackDockVariant = (typeof VARIANTS)[number]

export const FEEDBACK_DOCK_FLAG = 'docs-feedback-dock'

const VARIANTS = ['control', 'dock'] as const

const isVariant = (value: unknown): value is FeedbackDockVariant =>
  VARIANTS.some((variant) => variant === value)

export const useFeedbackDockVariant = (): FeedbackDockVariant | null => {
  const { posthog, hasLoaded } = useFeatureFlags()
  const { hasAccepted } = useConsentState()
  const override = useSearchParamsShallow().get(FEEDBACK_DOCK_FLAG)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  const flagValue = posthog[FEEDBACK_DOCK_FLAG]
  // false means the visitor is outside the rollout, not in the control group
  const isAssigned = isVariant(flagValue)
  const flagVariant: FeedbackDockVariant = flagValue === 'dock' ? 'dock' : 'control'

  useMountEffect(() => {
    // the flags can fail to load, so the control shows after a second
    const timer = setTimeout(() => setHasTimedOut(true), 1000)
    return () => clearTimeout(timer)
  })

  // exception: posthog resolves the flag after mount, and it has no event to hook
  useEffect(() => {
    if (!isAssigned) return
    // useSearchParamsShallow is empty until its own effect runs, so read the url directly
    if (isVariant(new URLSearchParams(window.location.search).get(FEEDBACK_DOCK_FLAG))) return

    posthogClient.captureExperimentExposure(
      FEEDBACK_DOCK_FLAG,
      { variant: flagVariant },
      hasAccepted
    )
  }, [isAssigned, flagVariant, hasAccepted])

  if (isVariant(override)) return override
  return hasLoaded || hasTimedOut ? flagVariant : null
}
