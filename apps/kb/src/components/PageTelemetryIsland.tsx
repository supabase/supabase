import { useConsentState } from 'common/consent-state'
import { IS_PLATFORM } from 'common/constants'
import { parseFirstReferrerCookie, parseMwDiagCookie } from 'common/first-referrer-cookie'
import { handlePageLeaveTelemetry, handlePageTelemetry } from 'common/page-telemetry'
import { posthogClient } from 'common/posthog-client'
import { clearFirstTouchData, getFirstTouchData } from 'common/telemetry-first-touch-store'
import { useEffect, useRef } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export function PageTelemetryIsland() {
  const { hasAccepted } = useConsentState()
  const hasSentRef = useRef(false)
  const enabled = IS_PLATFORM && hasAccepted

  useEffect(() => {
    if (!enabled || hasSentRef.current) return
    hasSentRef.current = true

    posthogClient.init()

    const cookieHeader = document.cookie
    const firstTouchData = getFirstTouchData()
    try {
      handlePageTelemetry({
        apiUrl: API_URL,
        pathname: window.location.pathname,
        ...(firstTouchData && { telemetryDataOverride: firstTouchData }),
        firstReferrerData: parseFirstReferrerCookie(cookieHeader),
        mwDiagData: parseMwDiagCookie(cookieHeader),
      })
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
