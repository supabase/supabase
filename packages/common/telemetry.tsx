'use client'

import { components } from 'api-types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLatest } from 'react-use'

import { useUser } from './auth'
import { hasConsented, useConsentState } from './consent-state'
import { createConsentedUrlCookieSync } from './consented-url-cookie'
import { IS_PLATFORM } from './constants'
import { useFeatureFlags } from './feature-flags'
import { post } from './fetchWrappers'
import { parseFirstReferrerCookie, parseMwDiagCookie } from './first-referrer-cookie'
import { useFramework, useHasFrameworkProvider } from './framework'
import { ensurePlatformSuffix, isBrowser } from './helpers'
import { useFirstTouchStore, useParams } from './hooks'
import { handlePageLeaveTelemetry, handlePageTelemetry } from './page-telemetry'
import {
  buildSessionRecordingConfig,
  posthogClient,
  type CapturedNetworkRequest,
  type ClientTelemetryEvent,
  type SessionRecordingOptions,
} from './posthog-client'
import { TelemetryEvent } from './telemetry-constants'
import { buildTelemetryEventRequest } from './telemetry-event'
import { clearFirstTouchData, getFirstTouchData } from './telemetry-first-touch-store'
import { setTelemetryPlatform, type TelemetryPlatform } from './telemetry-utils'

export { handlePageLeaveTelemetry }

export {
  buildSessionRecordingConfig,
  posthogClient,
  type CapturedNetworkRequest,
  type ClientTelemetryEvent,
  type SessionRecordingOptions,
}

const GTM_SCRIPT_ID = 'consent'
const GTM_INLINE_SCRIPT = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src="https://ss.supabase.com/4icgbaujh.js?"+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','60a389s=aWQ9R1RNLVdDVlJMTU43&page=2');`

export const TelemetryTagManager = () => {
  const { hasAccepted } = useConsentState()
  const [syncCookie] = useState(createConsentedUrlCookieSync)

  const isGTMEnabled = Boolean(
    IS_PLATFORM && process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID && hasAccepted
  )

  // Ad attribution capture is independent of GTM, so this runs even when the
  // container is not configured.
  useEffect(() => {
    syncCookie(hasAccepted)
  }, [hasAccepted, syncCookie])

  useEffect(() => {
    if (!isGTMEnabled || document.getElementById(GTM_SCRIPT_ID)) return

    const script = document.createElement('script')
    script.id = GTM_SCRIPT_ID
    script.textContent = GTM_INLINE_SCRIPT
    document.body.appendChild(script)
  }, [isGTMEnabled])

  return null
}

export const PageTelemetry = ({
  API_URL,
  platform,
  hasAcceptedConsent,
  enabled = true,
  organizationSlug,
  projectRef,
  sessionReplay,
}: {
  API_URL: string
  platform: TelemetryPlatform
  hasAcceptedConsent: boolean
  enabled?: boolean
  organizationSlug?: string
  projectRef?: string
  /** Masking policy for session replay. Omit to disable recording. */
  sessionReplay?: SessionRecordingOptions
}) => {
  setTelemetryPlatform(platform)

  const { pathname: frameworkPathname, asPath, isReady = true } = useFramework()
  // Without a provider nothing re-renders this on client-side navigation, so only the landing
  // pageview would be sent.
  const hasFrameworkProvider = useHasFrameworkProvider()
  if (process.env.NODE_ENV !== 'production' && !hasFrameworkProvider) {
    throw new Error('PageTelemetry must be rendered inside a FrameworkProvider')
  }

  const params = useParams()
  const slug = organizationSlug || params.slug
  const ref = projectRef || params.ref

  const featureFlags = useFeatureFlags()

  useFirstTouchStore({ enabled: enabled && IS_PLATFORM })

  const pathname = frameworkPathname ?? (isBrowser ? window.location.pathname : undefined)
  const routeKey = asPath ?? pathname
  const pathnameRef = useLatest(pathname)
  const featureFlagsRef = useLatest(featureFlags.posthog)

  const sendPageTelemetry = useCallback(() => {
    if (!(enabled && hasAcceptedConsent)) return Promise.resolve()

    return handlePageTelemetry({
      apiUrl: API_URL,
      pathname: pathnameRef.current,
      featureFlags: featureFlagsRef.current,
      slug,
      ref,
    }).catch((e) => {
      console.error('Problem sending telemetry page:', e)
    })
  }, [API_URL, enabled, hasAcceptedConsent, slug, ref])

  const sendPageLeaveTelemetry = useCallback(() => {
    if (!(enabled && hasAcceptedConsent)) return Promise.resolve()

    if (!pathnameRef.current) return Promise.resolve()

    return handlePageLeaveTelemetry(
      API_URL,
      pathnameRef.current,
      featureFlagsRef.current,
      slug,
      ref
    ).catch((e) => {
      console.error('Problem sending telemetry page-leave:', e)
    })
  }, [API_URL, enabled, hasAcceptedConsent, slug, ref])

  const hasSentInitialPageTelemetryRef = useRef(false)
  const lastSentUrlRef = useRef<string | null>(null)
  const previousRouteKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (hasAcceptedConsent && IS_PLATFORM) {
      posthogClient.init({ sessionReplay })
    }
  }, [hasAcceptedConsent, IS_PLATFORM, sessionReplay])

  // Waiting for isReady before sending to avoid dynamic route placeholders
  useEffect(() => {
    if (isReady && enabled && hasAcceptedConsent && !hasSentInitialPageTelemetryRef.current) {
      const cookieHeader = document.cookie
      const firstReferrerData = parseFirstReferrerCookie(cookieHeader)
      const mwDiagData = parseMwDiagCookie(cookieHeader)
      const firstTouchData = getFirstTouchData()

      try {
        handlePageTelemetry({
          apiUrl: API_URL,
          pathname: pathnameRef.current,
          featureFlags: featureFlagsRef.current,
          slug,
          ref,
          ...(firstTouchData && { telemetryDataOverride: firstTouchData }),
          firstReferrerData,
          mwDiagData,
        })
      } finally {
        clearFirstTouchData()
        hasSentInitialPageTelemetryRef.current = true
        lastSentUrlRef.current = window.location.pathname + window.location.search
      }
    }
  }, [isReady, enabled, hasAcceptedConsent, slug, ref])

  useEffect(() => {
    const currentRouteKey = routeKey ?? null
    const previousRouteKey = previousRouteKeyRef.current
    previousRouteKeyRef.current = currentRouteKey

    if (!hasSentInitialPageTelemetryRef.current) return
    if (previousRouteKey === null || previousRouteKey === currentRouteKey) return

    // Skip hash-only changes where pathname + search did not change, since `$current_url` drops the hash.
    const url = window.location.pathname + window.location.search
    if (url === lastSentUrlRef.current) return
    lastSentUrlRef.current = url
    sendPageTelemetry()
  }, [routeKey, sendPageTelemetry])

  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = () => sendPageLeaveTelemetry()

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, sendPageLeaveTelemetry])

  useEffect(() => {
    if (!enabled) return

    const handleExampleLinkClick = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest('a') : null
      if (!(anchor instanceof HTMLAnchorElement)) return

      const examplePath = anchor.href.match(EXAMPLE_LINK_PATTERN)?.[1].replace(/\/$/, '')
      if (!examplePath) return

      sendTelemetryEvent(
        API_URL,
        { action: 'example_link_clicked', properties: { examplePath } },
        pathnameRef.current
      )
    }

    document.addEventListener('click', handleExampleLinkClick, { capture: true })
    return () => document.removeEventListener('click', handleExampleLinkClick, { capture: true })
  }, [API_URL, enabled])

  useTelemetryIdentify(API_URL)

  return null
}

const EXAMPLE_LINK_PATTERN =
  /^https:\/\/github\.com\/supabase\/supabase\/(?:tree|blob)\/[^/]+\/examples\/([^?#]+)/

export function sendTelemetryEvent(API_URL: string, event: TelemetryEvent, pathname?: string) {
  const request = buildTelemetryEventRequest(API_URL, event, pathname)
  if (!request) return

  // keepalive lets the request survive a navigation that starts right after
  // the event (the OAuth redirect after sign_in_submitted, a plain-link click
  // into the dashboard), but keepalive requests share a ~64KB in-flight quota
  // page-wide, so it stays scoped to those events. Callers like useTrack
  // fire-and-forget, so rejections are handled here rather than surfacing
  // as unhandled promise rejections.
  return post(request.url, request.body, {
    headers: { Version: '2' },
    keepalive: request.keepalive,
  }).catch((error) => {
    console.error('Problem sending telemetry event:', error)
  })
}

//---
// TELEMETRY IDENTIFY
//---

type IdentifyBody = components['schemas']['TelemetryIdentifyBodyV2']

export function sendTelemetryIdentify(API_URL: string, body: IdentifyBody) {
  const consent = hasConsented()

  if (!consent) return Promise.resolve()

  return post(`${ensurePlatformSuffix(API_URL)}/telemetry/identify`, body, {
    headers: { Version: '2' },
  })
}

export function useTelemetryIdentify(API_URL: string) {
  const user = useUser()

  useEffect(() => {
    if (user?.id) {
      const anonymousId = posthogClient.getDistinctId()

      sendTelemetryIdentify(API_URL, {
        user_id: user.id,
        ...(anonymousId && { anonymous_id: anonymousId }),
      })

      // user.created_at is gotrue's immutable signup timestamp — safe to $set on
      // every identify because the value never changes per user. Lets flag
      // targeting distinguish brand-new signups from returning single-org users.
      posthogClient.identify(user.id, {
        gotrue_id: user.id,
        ...(user.created_at && { signup_timestamp: user.created_at }),
      })
    }
  }, [API_URL, user?.id])
}

//---
// TELEMETRY RESET
//---

export function handleResetTelemetry(API_URL: string) {
  return post(`${API_URL}/telemetry/reset`, {})
}
