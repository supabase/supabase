import { components } from 'api-types'
import { useRouter } from 'next/compat/router'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { LOCAL_STORAGE_KEYS } from './constants'
import { useFeatureFlags } from './feature-flags'
import { post } from './fetchWrappers'
import { ensurePlatformSuffix, isBrowser } from './helpers'
import { useTelemetryCookie } from './hooks'
import { TelemetryEvent } from './telemetry-constants'
import { useUser } from './auth'

//---
// PAGE TELEMETRY
//---

export function handlePageTelemetry(
  API_URL: string,
  pathname?: string,
  featureFlags?: {
    [key: string]: unknown
  },
  telemetryDataOverride?: components['schemas']['TelemetryPageBodyV2Dto']
) {
  return post(
    `${ensurePlatformSuffix(API_URL)}/telemetry/page`,
    telemetryDataOverride !== undefined
      ? { feature_flags: featureFlags, ...telemetryDataOverride }
      : {
          ...getSharedTelemetryData(pathname),
          feature_flags: featureFlags,
        },
    { headers: { Version: '2' } }
  )
}

export function handlePageLeaveTelemetry(
  API_URL: string,
  pathname: string,
  featureFlags?: {
    [key: string]: unknown
  }
) {
  return post(`${ensurePlatformSuffix(API_URL)}/telemetry/page-leave`, {
    body: {
      pathname,
      page_url: isBrowser ? window.location.href : '',
      page_title: isBrowser ? document?.title : '',
      feature_flags: featureFlags,
    },
  })
}

export const PageTelemetry = ({
  API_URL,
  hasAcceptedConsent,
  enabled = true,
}: {
  API_URL: string
  hasAcceptedConsent: boolean
  enabled?: boolean
}) => {
  const router = useRouter()

  const pagesPathname = router?.pathname
  const appPathname = usePathname()

  const featureFlags = useFeatureFlags()

  const title = typeof document !== 'undefined' ? document?.title : ''
  const referrer = typeof document !== 'undefined' ? document?.referrer : ''
  useTelemetryCookie({ hasAcceptedConsent, title, referrer })

  const sendPageTelemetry = useCallback(() => {
    if (!(enabled && hasAcceptedConsent)) return Promise.resolve()

    return handlePageTelemetry(
      API_URL,
      pagesPathname ?? appPathname ?? undefined,
      featureFlags.posthog
    ).catch((e) => {
      console.error('Problem sending telemetry page:', e)
    })
  }, [API_URL, pagesPathname, appPathname, hasAcceptedConsent, featureFlags.posthog])

  const sendPageLeaveTelemetry = useCallback(() => {
    if (!(enabled && hasAcceptedConsent)) return Promise.resolve()

    return handlePageTelemetry(
      API_URL,
      pagesPathname ?? appPathname ?? undefined,
      featureFlags.posthog
    ).catch((e) => {
      console.error('Problem sending telemetry page-leave:', e)
    })
  }, [pagesPathname, appPathname, hasAcceptedConsent, featureFlags.posthog])

  const hasSentInitialPageTelemetryRef = useRef(false)

  useEffect(() => {
    // Send page telemetry on first page load
    // Waiting for router ready before sending page_view
    // if not the path will be dynamic route instead of the browser url
    if (
      (router?.isReady ?? true) &&
      featureFlags.hasLoaded &&
      !hasSentInitialPageTelemetryRef.current
    ) {
      sendPageTelemetry()
      hasSentInitialPageTelemetryRef.current = true
    }
  }, [router?.isReady, featureFlags.hasLoaded])

  useEffect(() => {
    // For pages router
    if (router === null) return

    function handleRouteChange() {
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

    if (appPathname) {
      sendPageTelemetry()
    }
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

type EventBody = components['schemas']['TelemetryEventBodyV2Dto']

export function sendTelemetryEvent(API_URL: string, event: TelemetryEvent, pathname?: string) {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent) return

  const body: EventBody = {
    ...getSharedTelemetryData(pathname),
    action: event.action,
    custom_properties: 'properties' in event ? event.properties : {},
    groups: 'groups' in event ? event.groups : {},
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
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent) return Promise.resolve()

  return post(`${ensurePlatformSuffix(API_URL)}/telemetry/identify`, body, {
    headers: { Version: '2' },
  })
}

export function useTelemetryIdentify(API_URL: string) {
  const user = useUser()

  useEffect(() => {
    if (user?.id) {
      sendTelemetryIdentify(API_URL, {
        user_id: user.id,
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

// ---
// TELEMETRY UTILS
// ---

export function getSharedTelemetryData(pathname?: string) {
  return {
    page_url: isBrowser ? window.location.href : '',
    page_title: isBrowser ? document?.title : '',
    pathname: pathname ? pathname : isBrowser ? window.location.pathname : '',
    ph: {
      referrer: isBrowser ? document?.referrer : '',
      language: navigator.language ?? 'en-US',
      user_agent: navigator.userAgent,
      search: isBrowser ? window.location.search : '',
      viewport_height: isBrowser ? window.innerHeight : 0,
      viewport_width: isBrowser ? window.innerWidth : 0,
    },
  }
}
