'use client'

import { posthogClient, useConsentState, useFeatureFlags, useSearchParamsShallow } from 'common'
import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'
import { safeLocalStorage, safeSessionStorage } from 'common/safe-storage'
import { useEffect, useSyncExternalStore } from 'react'

import {
  IA_NAV_FLAG,
  IA_NAV_OVERRIDE_KEY,
  isIaNavVariant as isVariant,
  type IaNavVariant,
} from './constants'
import { useIaNavRouteVariant } from './IaNavRouteProvider'

const subscribeToNothing = () => () => {}

// the session override is the variant a url forced earlier in this browser session
const readSessionOverride = () => {
  const stored = safeSessionStorage.getItem(IA_NAV_OVERRIDE_KEY)
  return isVariant(stored) ? stored : null
}

// the url override wins, so a forced variant shows at hydration like a cached one
const readKnownFlag = () => {
  const override = new URLSearchParams(window.location.search).get(IA_NAV_FLAG)
  if (isVariant(override)) return override
  return readSessionOverride() ?? safeLocalStorage.getItem(LOCAL_STORAGE_KEYS.IA_NAV_FLAG)
}

/**
 * Reads the `docs-ia-mvp-v1` PostHog experiment flag.
 * While the flags load, or when the posthog request fails, it uses the value from the last visit.
 * If neither is known, it returns `'control'`, the current navigation.
 */
export function useIaNavVariant(): IaNavVariant {
  const { posthog, hasLoaded } = useFeatureFlags()
  const { hasAccepted } = useConsentState()
  const searchParams = useSearchParamsShallow()
  const routeVariant = useIaNavRouteVariant()
  const sessionOverride = useSyncExternalStore(subscribeToNothing, readSessionOverride, () => null)
  const urlOverride = searchParams.get(IA_NAV_FLAG)
  const override = routeVariant ?? (isVariant(urlOverride) ? urlOverride : sessionOverride)
  // the value known before the flags load. it is null on the server and on a first visit
  const knownFlag = useSyncExternalStore(subscribeToNothing, readKnownFlag, () => null)

  // exception: the url is outside React state and links drop it, so the override must outlive the page
  useEffect(() => {
    const urlOverride = new URLSearchParams(window.location.search).get(IA_NAV_FLAG)
    if (isVariant(urlOverride)) safeSessionStorage.setItem(IA_NAV_OVERRIDE_KEY, urlOverride)
  }, [searchParams])

  // a failed posthog request loads no flags at all, so the last assignment stays
  const hasPosthogFlags = hasLoaded && Object.keys(posthog).length > 0
  const flagValue = hasPosthogFlags ? posthog[IA_NAV_FLAG] : knownFlag
  // `false` means the visitor is outside the rollout, not assigned to control.
  const isAssigned = isVariant(flagValue)
  const flagVariant: IaNavVariant = flagValue === 'option-1' ? 'option-1' : 'control'

  // exception: the flags arrive through context, with no event to hook
  useEffect(() => {
    if (!hasPosthogFlags) return
    // a missing key means the flag is gone, so the cache drops the old assignment
    safeLocalStorage.setItem(LOCAL_STORAGE_KEYS.IA_NAV_FLAG, String(posthog[IA_NAV_FLAG] ?? false))
  }, [hasPosthogFlags, posthog])

  useEffect(() => {
    // the cached flag can be stale, so only the loaded flag records an exposure
    if (!hasPosthogFlags || !isAssigned || routeVariant) return
    // useSearchParamsShallow is empty until its own effect runs, so read the URL directly.
    const urlOverride = new URLSearchParams(window.location.search).get(IA_NAV_FLAG)
    if (isVariant(urlOverride) || sessionOverride) return

    posthogClient.captureExperimentExposure(IA_NAV_FLAG, { variant: flagVariant }, hasAccepted)
  }, [hasPosthogFlags, isAssigned, routeVariant, sessionOverride, flagVariant, hasAccepted])

  return isVariant(override) ? override : flagVariant
}
