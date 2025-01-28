import { sendTelemetryEvent } from 'common'
import { TelemetryEvent } from 'common/telemetry-constants'
import { API_URL } from 'lib/constants'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

export function useSendTelemetryEvent() {
  const router = useRouter()

  return useCallback(
    (event: TelemetryEvent) => {
      return sendTelemetryEvent(API_URL, event, router.pathname)
    },
    [router.pathname]
  )
}
