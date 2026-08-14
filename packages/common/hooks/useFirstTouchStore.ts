import { useEffect } from 'react'

import { setFirstTouchData } from '../telemetry-first-touch-store'
import { getSharedTelemetryData } from '../telemetry-utils'

interface UseFirstTouchStoreProps {
  enabled: boolean
}

export function useFirstTouchStore({ enabled }: UseFirstTouchStoreProps) {
  useEffect(() => {
    if (!enabled) return

    const telemetryData = getSharedTelemetryData(window.location.pathname)
    setFirstTouchData(telemetryData)
  }, [enabled])
}
