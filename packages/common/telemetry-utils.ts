import { IS_PROD, LOCAL_STORAGE_KEYS } from './constants'
import { isBrowser } from './helpers'

export function getTelemetryCookieOptions() {
  if (typeof window === 'undefined') return 'path=/; SameSite=Lax'
  if (!IS_PROD) return 'path=/; SameSite=Lax'

  const hostname = window.location.hostname
  const isSupabaseCom = hostname === 'supabase.com' || hostname.endsWith('.supabase.com')
  return isSupabaseCom ? 'path=/; domain=supabase.com; SameSite=Lax' : 'path=/; SameSite=Lax'
}

export function clearTelemetryDataCookie() {
  if (!isBrowser) return
  document.cookie = `${LOCAL_STORAGE_KEYS.TELEMETRY_DATA}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; ${getTelemetryCookieOptions()}`
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

export function getSharedTelemetryData(pathname?: string) {
  const sessionId = getPostHogSessionId()
  const pageUrl = (() => {
    if (!isBrowser) return ''

    try {
      const url = new URL(window.location.href)
      url.hash = ''
      return url.href
    } catch {
      return window.location.href.split('#')[0]
    }
  })()

  return {
    page_url: pageUrl,
    page_title: isBrowser ? document?.title : '',
    pathname: pathname ? pathname : isBrowser ? window.location.pathname : '',
    session_id: sessionId,
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
