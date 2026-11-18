import { IS_PROD } from './constants'
import { isBrowser } from './helpers'

export type TelemetryPlatform = 'studio' | 'www' | 'docs' | 'kb' | 'learn' | 'ui-library'

let telemetryPlatform: TelemetryPlatform | undefined

export function setTelemetryPlatform(platform: TelemetryPlatform) {
  telemetryPlatform = platform
}

export function getTelemetryPlatform() {
  return telemetryPlatform
}

export function getTelemetryCookieOptions() {
  if (typeof window === 'undefined') return 'path=/; SameSite=Lax'
  if (!IS_PROD) return 'path=/; SameSite=Lax'

  const hostname = window.location.hostname
  const isSupabaseCom = hostname === 'supabase.com' || hostname.endsWith('.supabase.com')
  return isSupabaseCom ? 'path=/; domain=supabase.com; SameSite=Lax' : 'path=/; SameSite=Lax'
}

// Parse session_id from PostHog cookie since SDK doesn't expose session ID
// (needed to correlate client and server events)
function getPostHogSessionId(): string | null {
  if (!isBrowser) return null

  try {
    // Parse PostHog cookie to extract session ID
    const phCookies = document.cookie.split(';').find((cookie) => cookie.trim().startsWith('ph_'))

    if (phCookies) {
      const cookieValue = decodeURIComponent(phCookies.split('=')[1])
      const phData = JSON.parse(cookieValue)
      if (phData.$sesid && Array.isArray(phData.$sesid) && phData.$sesid[1]) {
        return phData.$sesid[1]
      }
    }
  } catch (error) {
    console.warn('Could not extract PostHog session ID:', error)
  }

  return null
}

const KEYWORDS_PARAM_PATTERN = /([?&]keywords=)[^&#]*/g

// Studio's Auth users page keeps its search term, often an end user's email, in `keywords`.
export function redactUrlKeywords(url: string) {
  return url.replace(KEYWORDS_PARAM_PATTERN, '$1redacted')
}

type EventProperties = Record<string, unknown>

// posthog-js fills its own URL properties (session entry URL, initial URL, referrers) from the
// browser, so the outgoing event is cleaned by value instead of by a list of property names.
export function redactEventUrlKeywords(event: {
  properties: EventProperties
  $set?: EventProperties
  $set_once?: EventProperties
}) {
  const { properties } = event
  const propertyBags = [
    properties,
    properties.$set,
    properties.$set_once,
    event.$set,
    event.$set_once,
  ]

  for (const bag of propertyBags) {
    if (!bag || typeof bag !== 'object') continue

    for (const [key, value] of Object.entries(bag)) {
      if (typeof value === 'string') (bag as EventProperties)[key] = redactUrlKeywords(value)
    }
  }
}

function getPageLocation() {
  if (!isBrowser) return { pageUrl: '', search: '' }

  try {
    const url = new URL(window.location.href)
    url.hash = ''
    return { pageUrl: redactUrlKeywords(url.href), search: redactUrlKeywords(url.search) }
  } catch {
    return { pageUrl: window.location.href.split('#')[0], search: window.location.search }
  }
}

export function getSharedTelemetryData(pathname?: string) {
  const sessionId = getPostHogSessionId()
  const { pageUrl, search } = getPageLocation()

  return {
    page_url: pageUrl,
    page_title: isBrowser ? document?.title : '',
    pathname: pathname ? pathname : isBrowser ? window.location.pathname : '',
    session_id: sessionId,
    ph: {
      referrer: isBrowser ? redactUrlKeywords(document?.referrer ?? '') : '',
      language: navigator.language ?? 'en-US',
      user_agent: navigator.userAgent,
      search,
      viewport_height: isBrowser ? window.innerHeight : 0,
      viewport_width: isBrowser ? window.innerWidth : 0,
    },
  }
}
