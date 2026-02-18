'use client'

import { components } from 'api-types'
import { useRouter } from 'next/compat/router'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useCallback, useEffect, useRef } from 'react'
import { useLatest } from 'react-use'

import { useUser } from './auth'
import { hasConsented } from './consent-state'
import { IS_PLATFORM, IS_PROD, LOCAL_STORAGE_KEYS } from './constants'
import { useFeatureFlags } from './feature-flags'
import { post } from './fetchWrappers'
import { ensurePlatformSuffix, isBrowser } from './helpers'
import { useParams, useTelemetryCookie } from './hooks'
import { posthogClient, type ClientTelemetryEvent } from './posthog-client'
import { TelemetryEvent } from './telemetry-constants'
import {
  clearTelemetryDataCookie,
  getSharedTelemetryData,
  getTelemetryCookieOptions,
} from './telemetry-utils'

export { posthogClient, type ClientTelemetryEvent }

const { TELEMETRY_DATA } = LOCAL_STORAGE_KEYS

// Reexports GoogleTagManager with the right API key set
export const TelemetryTagManager = () => {
  const isGTMEnabled = Boolean(IS_PLATFORM && process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID)

  if (!isGTMEnabled) {
    return
  }

  return (
    <Script
      id="consent"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src="https://ss.supabase.com/4icgbaujh.js?"+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','60a389s=aWQ9R1RNLVdDVlJMTU43&page=2');`,
      }}
    />
  )
}

//---
// PAGE TELEMETRY
//---
type SharedTelemetryData = ReturnType<typeof getSharedTelemetryData>

function getFirstTouchAttributionProps(telemetryData: SharedTelemetryData) {
  const urlString = telemetryData.page_url

  try {
    const url = new URL(urlString)
    url.hash = ''
    const params = url.searchParams

    const getParam = (key: string) => {
      const value = params.get(key)
      return value && value.length > 0 ? value : undefined
    }

    const utmProps = {
      ...(getParam('utm_source') && { $utm_source: getParam('utm_source') }),
      ...(getParam('utm_medium') && { $utm_medium: getParam('utm_medium') }),
      ...(getParam('utm_campaign') && { $utm_campaign: getParam('utm_campaign') }),
      ...(getParam('utm_content') && { $utm_content: getParam('utm_content') }),
      ...(getParam('utm_term') && { $utm_term: getParam('utm_term') }),
    }

    // Ad network click IDs (first-touch attribution)
    const clickIdProps = {
      ...(getParam('gclid') && { gclid: getParam('gclid') }), // Google Ads
      ...(getParam('gbraid') && { gbraid: getParam('gbraid') }), // Google Ads (iOS)
      ...(getParam('wbraid') && { wbraid: getParam('wbraid') }), // Google Ads (iOS)
      ...(getParam('msclkid') && { msclkid: getParam('msclkid') }), // Microsoft Ads (Bing)
      ...(getParam('fbclid') && { fbclid: getParam('fbclid') }), // Meta (Facebook/Instagram)
      ...(getParam('rdt_cid') && { rdt_cid: getParam('rdt_cid') }), // Reddit Ads
      ...(getParam('ttclid') && { ttclid: getParam('ttclid') }), // TikTok Ads
      ...(getParam('twclid') && { twclid: getParam('twclid') }), // X Ads (Twitter)
      ...(getParam('li_fat_id') && { li_fat_id: getParam('li_fat_id') }), // LinkedIn Ads
    }

    return {
      ...utmProps,
      ...clickIdProps,
      first_touch_url: url.href,
      first_touch_pathname: url.pathname,
      ...(url.search && { first_touch_search: url.search }),
    }
  } catch {
    return {}
  }
}

function isExternalReferrer(referrer: string) {
  try {
    const hostname = new URL(referrer).hostname
    return hostname !== 'supabase.com' && !hostname.endsWith('.supabase.com')
  } catch {
    return false
  }
}

function handlePageTelemetry(
  API_URL: string,
  pathname?: string,
  featureFlags?: {
    [key: string]: unknown
  },
  slug?: string,
  ref?: string,
  telemetryDataOverride?: SharedTelemetryData
) {
  // Send to PostHog client-side (only in browser)
  if (typeof window !== 'undefined') {
    const livePageData = getSharedTelemetryData(pathname)
    const liveReferrer = livePageData.ph.referrer
    const cookieReferrer = telemetryDataOverride?.ph?.referrer

    const shouldUseCookieReferrer = Boolean(
      cookieReferrer && isExternalReferrer(cookieReferrer) && !isExternalReferrer(liveReferrer)
    )

    const pageData = telemetryDataOverride
      ? {
          ...livePageData,
          ph: {
            ...livePageData.ph,
            referrer: shouldUseCookieReferrer ? cookieReferrer! : liveReferrer,
          },
        }
      : livePageData
    const firstTouchAttributionProps = telemetryDataOverride
      ? getFirstTouchAttributionProps(telemetryDataOverride)
      : {}

    const $referrer = pageData.ph.referrer
    const $referring_domain = (() => {
      if (!$referrer) return undefined
      try {
        return new URL($referrer).hostname
      } catch {
        return undefined
      }
    })()

    // Align frontend and backend session IDs for correlation
    if (pageData.session_id) {
      document.cookie = `session_id=${pageData.session_id}; ${getTelemetryCookieOptions()}`
    }

    posthogClient.capturePageView({
      $current_url: pageData.page_url,
      $pathname: pageData.pathname,
      $host: new URL(pageData.page_url).hostname,
      ...($referrer && { $referrer }),
      ...($referring_domain && { $referring_domain }),
      ...firstTouchAttributionProps,
      $groups: {
        ...(slug ? { organization: slug } : {}),
        ...(ref ? { project: ref } : {}),
      },
      page_title: pageData.page_title,
      ...(pageData.session_id && { $session_id: pageData.session_id }),
      ...pageData.ph,
      ...Object.fromEntries(
        Object.entries(featureFlags || {}).map(([k, v]) => [`$feature/${k}`, v])
      ),
    })
  }

  return Promise.resolve()
}

export function handlePageLeaveTelemetry(
  API_URL: string,
  pathname: string,
  featureFlags?: {
    [key: string]: unknown
  },
  slug?: string,
  ref?: string
) {
  // Send to PostHog client-side (only in browser)
  if (typeof window !== 'undefined') {
    const pageData = getSharedTelemetryData(pathname)
    posthogClient.capturePageLeave({
      $current_url: pageData.page_url,
      $pathname: pageData.pathname,
      page_title: pageData.page_title,
      ...(pageData.session_id && { $session_id: pageData.session_id }),
    })
  }

  return Promise.resolve()
}

export const PageTelemetry = ({
  API_URL,
  hasAcceptedConsent,
  enabled = true,
  organizationSlug,
  projectRef,
}: {
  API_URL: string
  hasAcceptedConsent: boolean
  enabled?: boolean
  organizationSlug?: string
  projectRef?: string
}) => {
  const router = useRouter()

  const pagesPathname = router?.pathname
  const appPathname = usePathname()

  // Get from props or try to extract from URL params
  const params = useParams()
  const slug = organizationSlug || params.slug
  const ref = projectRef || params.ref

  const featureFlags = useFeatureFlags()

  useTelemetryCookie({ enabled: enabled && IS_PLATFORM })

  const pathname =
    pagesPathname ?? appPathname ?? (isBrowser ? window.location.pathname : undefined)
  const pathnameRef = useLatest(pathname)
  const featureFlagsRef = useLatest(featureFlags.posthog)

  const sendPageTelemetry = useCallback(() => {
    if (!(enabled && hasAcceptedConsent)) return Promise.resolve()

    return handlePageTelemetry(
      API_URL,
      pathnameRef.current,
      featureFlagsRef.current,
      slug,
      ref
    ).catch((e) => {
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

  // Handle initial page telemetry event
  const hasSentInitialPageTelemetryRef = useRef(false)

  // Track previous pathname for App Router to detect actual changes
  const previousAppPathnameRef = useRef<string | null>(null)

  // Initialize PostHog client when consent is accepted
  useEffect(() => {
    if (hasAcceptedConsent && IS_PLATFORM) {
      posthogClient.init(true)
    }
  }, [hasAcceptedConsent, IS_PLATFORM])

  useEffect(() => {
    // Send page telemetry on first page load
    // Waiting for router ready before sending page_view
    // if not the path will be dynamic route instead of the browser url
    if (
      (router?.isReady ?? true) &&
      hasAcceptedConsent &&
      !hasSentInitialPageTelemetryRef.current
    ) {
      const cookies = document.cookie.split(';')
      const telemetryCookieValue = cookies
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${TELEMETRY_DATA}=`))
        ?.slice(`${TELEMETRY_DATA}=`.length)

      if (telemetryCookieValue) {
        try {
          const telemetryData = JSON.parse(
            decodeURIComponent(telemetryCookieValue)
          ) as SharedTelemetryData
          handlePageTelemetry(
            API_URL,
            pathnameRef.current,
            featureFlagsRef.current,
            slug,
            ref,
            telemetryData
          )
        } catch (error) {
          if (!IS_PROD) {
            console.warn('Invalid telemetry cookie data:', error)
          }
          handlePageTelemetry(API_URL, pathnameRef.current, featureFlagsRef.current, slug, ref)
        } finally {
          clearTelemetryDataCookie()
        }
      } else {
        handlePageTelemetry(API_URL, pathnameRef.current, featureFlagsRef.current, slug, ref)
      }

      hasSentInitialPageTelemetryRef.current = true
    }
  }, [router?.isReady, hasAcceptedConsent, slug, ref])

  useEffect(() => {
    // For pages router
    if (router === null) return

    function handleRouteChange() {
      // Wait until we've sent the initial page telemetry event
      if (!hasSentInitialPageTelemetryRef.current) return

      sendPageTelemetry()
    }

    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])

  useEffect(() => {
    // For app router
    if (router !== null) return

    // Only track if pathname actually changed (not initial mount)
    if (
      appPathname &&
      previousAppPathnameRef.current !== null &&
      previousAppPathnameRef.current !== appPathname
    ) {
      sendPageTelemetry()
    }

    // Update previous pathname
    previousAppPathnameRef.current = appPathname
  }, [appPathname, router, sendPageTelemetry])

  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = () => sendPageLeaveTelemetry()

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, sendPageLeaveTelemetry])

  // Identify the user
  useTelemetryIdentify(API_URL)

  return null
}

// ---
// EVENT TELEMETRY
// ---

type EventBody = components['schemas']['TelemetryEventBodyV2']

export function sendTelemetryEvent(API_URL: string, event: TelemetryEvent, pathname?: string) {
  const consent = hasConsented()
  if (!consent) return

  const body: EventBody = {
    ...getSharedTelemetryData(pathname),
    action: event.action,
    custom_properties: 'properties' in event ? event.properties : {},
    groups: 'groups' in event ? { ...event.groups } : {},
  }

  if (body.groups?.project === 'Unknown') {
    delete body.groups.project
    if (body.groups?.organization === 'Unknown') {
      delete body.groups
    }
  }

  return post(`${ensurePlatformSuffix(API_URL)}/telemetry/event`, body, {
    headers: { Version: '2' },
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

      posthogClient.identify(user.id, { gotrue_id: user.id })
    }
  }, [API_URL, user?.id])
}

//---
// TELEMETRY RESET
//---

export function handleResetTelemetry(API_URL: string) {
  return post(`${API_URL}/telemetry/reset`, {})
}
