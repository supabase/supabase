import { sendTelemetryEvent } from 'common'
import { TelemetryEvent } from 'common/telemetry-constants'
import { usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { API_URL } from './constants'

export function useSendTelemetryEvent() {
  const pathname = usePathname()

  return useCallback(
    (event: TelemetryEvent) => {
      return sendTelemetryEvent(API_URL, event, pathname)
    },
    [pathname]
  )
}
