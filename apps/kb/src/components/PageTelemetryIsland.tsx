import { useConsentState } from 'common/consent-state'
import { IS_PLATFORM } from 'common/constants'
import { parseFirstReferrerCookie, parseMwDiagCookie } from 'common/first-referrer-cookie'
import { useFirstTouchStore } from 'common/hooks/useFirstTouchStore'
import { handlePageLeaveTelemetry, handlePageTelemetry } from 'common/page-telemetry'
import { posthogClient } from 'common/posthog-client'
import { clearFirstTouchData, getFirstTouchData } from 'common/telemetry-first-touch-store'
import { useEffect, useRef } from 'react'

import { BASE_PATH } from '../lib/constants'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export function PageTelemetryIsland() {
  const { hasAccepted } = useConsentState()
  const hasSentRef = useRef(false)
  const enabled = IS_PLATFORM && hasAccepted

  useFirstTouchStore({ enabled: IS_PLATFORM })

  useEffect(() => {
    if (!enabled || hasSentRef.current) return
    hasSentRef.current = true

    posthogClient.init()

    const isEntryPage = !document.referrer.startsWith(`${window.location.origin}${BASE_PATH}`)
    const cookieHeader = document.cookie
    const firstTouchData = isEntryPage ? getFirstTouchData() : null
    try {
      handlePageTelemetry({
        apiUrl: API_URL,
        pathname: window.location.pathname,
        ...(firstTouchData && { telemetryDataOverride: firstTouchData }),
        ...(isEntryPage && {
          firstReferrerData: parseFirstReferrerCookie(cookieHeader),
          mwDiagData: parseMwDiagCookie(cookieHeader),
        }),
      })
    } finally {
      clearFirstTouchData()
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = () => handlePageLeaveTelemetry(API_URL, window.location.pathname)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted)
        handlePageTelemetry({ apiUrl: API_URL, pathname: window.location.pathname })
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pageshow', handlePageShow)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [enabled])

  return null
}
