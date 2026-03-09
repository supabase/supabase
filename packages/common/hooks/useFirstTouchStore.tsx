import { useEffect } from 'react'

import { setFirstTouchData } from '../telemetry-first-touch-store'
import { getSharedTelemetryData } from '../telemetry-utils'

interface UseFirstTouchStoreProps {
  enabled: boolean
}

/**
 * Captures first-touch attribution data (e.g. `document.referrer`, UTM params)
 * into an in-memory store on the initial page load — before consent is granted.
 *
 * The data is read once by PageTelemetry after consent and then cleared.
 * Using in-memory storage (instead of a cookie) ensures no non-essential
 * device storage before affirmative consent in GDPR regions.
 */
export function useFirstTouchStore({ enabled }: UseFirstTouchStoreProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!enabled) return

    const telemetryData = getSharedTelemetryData(window.location.pathname)
    setFirstTouchData(telemetryData)
  }, [enabled])
}

export default useFirstTouchStore
