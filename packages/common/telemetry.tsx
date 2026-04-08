'use client'

import { components } from 'api-types'
import { useRouter } from 'next/compat/router'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useCallback, useEffect, useRef } from 'react'
import { useLatest } from 'react-use'

import { useUser } from './auth'
import { hasConsented, useConsentState } from './consent-state'
import { IS_PLATFORM } from './constants'
import { useFeatureFlags } from './feature-flags'
import { post } from './fetchWrappers'
import type { FirstReferrerData, MwDiagData } from './first-referrer-cookie'
import {
  isExternalReferrer,
  isOAuthRedirectReferrer,
  parseFirstReferrerCookie,
  parseMwDiagCookie,
} from './first-referrer-cookie'
import { ensurePlatformSuffix, isBrowser } from './helpers'
import { useFirstTouchStore, useParams } from './hooks'
import { posthogClient, type ClientTelemetryEvent } from './posthog-client'
import { TelemetryEvent } from './telemetry-constants'
import {
  clearFirstTouchData,
  getFirstTouchData,
  type SharedTelemetryData,
} from './telemetry-first-touch-store'
import { getSharedTelemetryData, getTelemetryCookieOptions } from './telemetry-utils'

export { posthogClient, type ClientTelemetryEvent }

export const TelemetryTagManager = () => {
  const { hasAccepted } = useConsentState()

  const isGTMEnabled = Boolean(
    IS_PLATFORM && process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID && hasAccepted
  )

  if (!isGTMEnabled) return null

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

interface HandlePageTelemetryOptions {
  apiUrl: string
  pathname?: string
  featureFlags?: Record<string, unknown>
  slug?: string
  ref?: string
  telemetryDataOverride?: SharedTelemetryData
  firstReferrerData?: FirstReferrerData | null
  mwDiagData?: MwDiagData | null
}

function handlePageTelemetry({
  apiUrl: API_URL,
  pathname,
  featureFlags,
  slug,
  ref,
  telemetryDataOverride,
  firstReferrerData,
  mwDiagData,
}: HandlePageTelemetryOptions) {
  if (typeof window !== 'undefined') {
    const livePageData = getSharedTelemetryData(pathname)
    const liveReferrer = livePageData.ph.referrer
    const storedReferrer = telemetryDataOverride?.ph?.referrer

    const shouldUseStoredReferrer = Boolean(
      storedReferrer &&
      isExternalReferrer(storedReferrer) &&
      !isOAuthRedirectReferrer(storedReferrer) &&
      (!isExternalReferrer(liveReferrer) || isOAuthRedirectReferrer(liveReferrer))
    )

    const pageData = telemetryDataOverride
      ? {
          ...livePageData,
          ph: {
            ...livePageData.ph,
            referrer: shouldUseStoredReferrer ? storedReferrer! : liveReferrer,
          },
        }
      : { ...livePageData, ph: { ...livePageData.ph } }
    const firstTouchAttributionProps: Record<string, string> = {
      ...(telemetryDataOverride ? getFirstTouchAttributionProps(telemetryDataOverride) : {}),
    }

    const firstReferrerCookiePresent = Boolean(firstReferrerData)
    let firstReferrerCookieConsumed = false

    if (
      firstReferrerData &&
      isExternalReferrer(firstReferrerData.referrer) &&
      !isOAuthRedirectReferrer(firstReferrerData.referrer) &&
      (!isExternalReferrer(pageData.ph.referrer) || isOAuthRedirectReferrer(pageData.ph.referrer))
    ) {
      pageData.ph.referrer = firstReferrerData.referrer
      firstReferrerCookieConsumed = true

      const { utms, click_ids, landing_url } = firstReferrerData

      Object.entries(utms).forEach(([key, value]) => {
        const phKey = key.startsWith('utm_') ? `$${key}` : key
        firstTouchAttributionProps[phKey] = value
      })

      Object.entries(click_ids).forEach(([key, value]) => {
        firstTouchAttributionProps[key] = value
      })

      try {
        const url = new URL(landing_url)
        firstTouchAttributionProps.first_touch_url = url.href
        firstTouchAttributionProps.first_touch_pathname = url.pathname

        if (url.search) {
          firstTouchAttributionProps.first_touch_search = url.search
        } else {
          delete firstTouchAttributionProps.first_touch_search
        }
      } catch {
        // Skip if landing URL is malformed
      }
    }

    const $referrer = pageData.ph.referrer
    const $referring_domain = (() => {
      if (!$referrer) return undefined
      try {
        return new URL($referrer).hostname
      } catch {
        return undefined
      }
    })()

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
      // Only included on the initial pageview — subsequent pageviews omit firstReferrerData entirely
      ...(firstReferrerData !== undefined && {
        first_referrer_cookie_present: firstReferrerCookiePresent,
        first_referrer_cookie_consumed: firstReferrerCookieConsumed,
      }),
      ...(mwDiagData && {
        mw_diag_hit: mwDiagData.hit,
        mw_diag_would_stamp: mwDiagData.would_stamp,
        mw_diag_has_existing_cookie: mwDiagData.has_existing_cookie,
      }),
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

  const params = useParams()
  const slug = organizationSlug || params.slug
  const ref = projectRef || params.ref

  const featureFlags = useFeatureFlags()

  useFirstTouchStore({ enabled: enabled && IS_PLATFORM })

  const pathname =
    pagesPathname ?? appPathname ?? (isBrowser ? window.location.pathname : undefined)
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
  const previousAppPathnameRef = useRef<string | null>(null)

  useEffect(() => {
    if (hasAcceptedConsent && IS_PLATFORM) {
      posthogClient.init(true)
    }
  }, [hasAcceptedConsent, IS_PLATFORM])

  // Waiting for router.isReady before sending to avoid dynamic route placeholders
  useEffect(() => {
    if (
      (router?.isReady ?? true) &&
      enabled &&
      hasAcceptedConsent &&
      !hasSentInitialPageTelemetryRef.current
    ) {
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
      }
    }
  }, [router?.isReady, enabled, hasAcceptedConsent, slug, ref])

  useEffect(() => {
    if (router === null) return

    function handleRouteChange() {
      if (!hasSentInitialPageTelemetryRef.current) return
      sendPageTelemetry()
    }

    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])

  useEffect(() => {
    if (router !== null) return

    if (
      appPathname &&
      previousAppPathnameRef.current !== null &&
      previousAppPathnameRef.current !== appPathname
    ) {
      sendPageTelemetry()
    }

    previousAppPathnameRef.current = appPathname
  }, [appPathname, router, sendPageTelemetry])

  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = () => sendPageLeaveTelemetry()

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, sendPageLeaveTelemetry])

  useTelemetryIdentify(API_URL)

  return null
}

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
