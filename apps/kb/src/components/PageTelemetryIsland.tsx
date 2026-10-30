import { useConsentState } from 'common/consent-state'
import { IS_PLATFORM } from 'common/constants'
import {
  isExternalReferrer,
  parseFirstReferrerCookie,
  parseMwDiagCookie,
} from 'common/first-referrer-cookie'
import { useFirstTouchStore } from 'common/hooks/useFirstTouchStore'
import { handlePageLeaveTelemetry, handlePageTelemetry } from 'common/page-telemetry'
import { posthogClient } from 'common/posthog-client'
import { clearFirstTouchData, getFirstTouchData } from 'common/telemetry-first-touch-store'
import { useEffect, useRef } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
const FIRST_PAGEVIEW_SENT_KEY = 'kb_first_pageview_sent'

function hasSentFirstPageview() {
  try {
    return sessionStorage.getItem(FIRST_PAGEVIEW_SENT_KEY) !== null
  } catch {
    return false
  }
}

function markFirstPageviewSent() {
  try {
    sessionStorage.setItem(FIRST_PAGEVIEW_SENT_KEY, '1')
  } catch {}
}

export function PageTelemetryIsland() {
  const { hasAccepted } = useConsentState()
  const hasSentRef = useRef(false)
  const enabled = IS_PLATFORM && hasAccepted

  useFirstTouchStore({ enabled: IS_PLATFORM })

  useEffect(() => {
    if (!enabled || hasSentRef.current) return
    hasSentRef.current = true

    posthogClient.init()

    const isFirstPageview =
      !hasSentFirstPageview() || !document.referrer || isExternalReferrer(document.referrer)
    const cookieHeader = document.cookie
    const firstTouchData = isFirstPageview ? getFirstTouchData() : null
    try {
      handlePageTelemetry({
        apiUrl: API_URL,
        pathname: window.location.pathname,
        ...(firstTouchData && { telemetryDataOverride: firstTouchData }),
        ...(isFirstPageview && {
          firstReferrerData: parseFirstReferrerCookie(cookieHeader),
          mwDiagData: parseMwDiagCookie(cookieHeader),
        }),
      })
      markFirstPageviewSent()
    } finally {
      clearFirstTouchData()
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = () => handlePageLeaveTelemetry(API_URL, window.location.pathname)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled])

  return null
}
