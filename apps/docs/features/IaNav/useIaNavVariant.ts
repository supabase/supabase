'use client'

import { posthogClient, useConsentState, useFeatureFlags, useSearchParamsShallow } from 'common'
import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'
import { safeLocalStorage } from 'common/safe-storage'
import { useEffect, useSyncExternalStore } from 'react'

import { IA_NAV_FLAG, isIaNavVariant as isVariant, type IaNavVariant } from './constants'

const subscribeToNothing = () => () => {}

const readCachedFlag = () => safeLocalStorage.getItem(LOCAL_STORAGE_KEYS.IA_NAV_FLAG)

/**
 * The flag value from the visitor's last visit, so the nav can show before the flags load.
 * `null` on the server and on a first visit.
 */
export function useCachedIaNavFlag(): string | null {
  return useSyncExternalStore(subscribeToNothing, readCachedFlag, () => null)
}

/**
 * Reads the `docs-ia-mvp-v1` PostHog experiment flag.
 * Uses the cached value from the last visit while the flag store is loading, and defaults to
 * `'control'` if neither is known, so an unresolved state always falls back to the current navigation.
 */
export function useIaNavVariant(): IaNavVariant {
  const { posthog, hasLoaded } = useFeatureFlags()
  const { hasAccepted } = useConsentState()
  const searchParams = useSearchParamsShallow()
  const override = searchParams.get(IA_NAV_FLAG)
  const cachedFlag = useCachedIaNavFlag()

  const flagValue = hasLoaded ? posthog[IA_NAV_FLAG] : cachedFlag
  // `false` means the visitor is outside the rollout, not assigned to control.
  const isAssigned = isVariant(flagValue)
  const flagVariant: IaNavVariant = flagValue === 'option-1' ? 'option-1' : 'control'

  // exception: the flags arrive through context, with no event to hook
  useEffect(() => {
    const loadedFlag = posthog[IA_NAV_FLAG]
    // a failed or skipped posthog load leaves the flag undefined, so the last assignment stays
    if (!hasLoaded || loadedFlag === undefined) return
    safeLocalStorage.setItem(LOCAL_STORAGE_KEYS.IA_NAV_FLAG, String(loadedFlag))
  }, [hasLoaded, posthog])

  useEffect(() => {
    // the cached flag can be stale, so only the loaded flag records an exposure
    if (!hasLoaded || !isAssigned) return
    // useSearchParamsShallow is empty until its own effect runs, so read the URL directly.
    const urlOverride = new URLSearchParams(window.location.search).get(IA_NAV_FLAG)
    if (isVariant(urlOverride)) return

    posthogClient.captureExperimentExposure(IA_NAV_FLAG, { variant: flagVariant }, hasAccepted)
  }, [hasLoaded, isAssigned, flagVariant, hasAccepted])

  return isVariant(override) ? override : flagVariant
}
