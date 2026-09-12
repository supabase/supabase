import { subscribe } from 'valtio'

import { consentState } from './consent-state'
import { getTelemetryCookieOptions } from './telemetry-utils'

const COOKIE_NAME = 'bfcid'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30
// Not held in memory, because it has to survive the page load the visitor
// landed on. Session-scoped, so it never outlives the tab.
const PENDING_STORAGE_KEY = 'sb-bfcid-pending'

// Mirrors the validator Freebuff publishes, so a value stored here is never
// one they reject.
const CLICK_ID_SHAPE = /^bfc_[A-Za-z0-9._-]{1,508}$/

function readPendingValue(): string | null {
  try {
    return sessionStorage.getItem(PENDING_STORAGE_KEY)
  } catch {
    return null
  }
}

function writePendingValue(value: string): void {
  try {
    sessionStorage.setItem(PENDING_STORAGE_KEY, value)
  } catch {
    // Storage restrictions must not prevent the page from rendering.
  }
}

function clearPendingValue(): void {
  try {
    sessionStorage.removeItem(PENDING_STORAGE_KEY)
  } catch {
    // Storage restrictions must not prevent a consent update.
  }
}

function getParameterValue(url: string): string | null {
  try {
    const values = new URL(url).searchParams.getAll(COOKIE_NAME)
    if (values.length !== 1) return null

    const value = values[0]
    return CLICK_ID_SHAPE.test(value) ? value : null
  } catch {
    return null
  }
}

function getCookieOptions(): string {
  return `${getTelemetryCookieOptions()}${window.location.protocol === 'https:' ? '; Secure' : ''}`
}

/** Remove the cookie, leaving any value still awaiting a consent decision. */
export function clearConsentedUrlCookie(): void {
  if (typeof document === 'undefined') return

  try {
    document.cookie = `${COOKIE_NAME}=; Max-Age=0; ${getCookieOptions()}`
    // Outside production the write is host-only, so clear that variant too.
    document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`
  } catch {
    // Cookie restrictions must not break the page.
  }
}

/** Remove the cookie and any value awaiting a consent decision. */
export function discardConsentedUrlValue(): void {
  clearPendingValue()
  clearConsentedUrlCookie()
}

/** True until the visitor has either accepted or declined. */
function isDecisionPending(): boolean {
  return !consentState.isResolved || consentState.showConsentToast
}

/**
 * The single rule tying the stored click id to the consent decision.
 *
 * Undecided and declined both mean there is no consent to point at, so the
 * cookie goes either way. They differ in the retained value: an undecided
 * visitor may still accept, so it is kept until they decide.
 */
function enforceConsentDecision(): void {
  if (!consentState.isResolved || consentState.hasConsented) return

  if (consentState.showConsentToast) {
    clearConsentedUrlCookie()
    return
  }

  discardConsentedUrlValue()
}

if (typeof window !== 'undefined') {
  subscribe(consentState, enforceConsentDecision)
}

/**
 * Retain the click id until consent permits writing a cookie.
 *
 * The cookie is scoped to `domain=supabase.com` so the management API receives
 * it, and is written only after consent, which is how the API knows consent
 * was granted.
 */
export function createConsentedUrlCookieSync() {
  return (hasAccepted: boolean): void => {
    if (typeof window === 'undefined') return

    const valueFromUrl = getParameterValue(window.location.href)
    if (valueFromUrl && !hasAccepted && isDecisionPending()) {
      writePendingValue(valueFromUrl)
    }

    if (!hasAccepted) return

    const value = valueFromUrl ?? readPendingValue()
    if (!value) return

    try {
      const cookie = `${COOKIE_NAME}=${value}`
      const hasSameValue = document.cookie.split(';').some((part) => part.trim() === cookie)

      // Ordinary navigation must not extend the original cookie lifetime.
      if (!hasSameValue) {
        document.cookie = `${cookie}; Max-Age=${COOKIE_MAX_AGE}; ${getCookieOptions()}`
      }
    } catch {
      // Cookie restrictions must not break the page.
    }

    clearPendingValue()
  }
}
