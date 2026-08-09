'use client'

import { sendTelemetryEvent } from 'common'
import type { TelemetryEvent } from 'common/telemetry-constants'
import { API_URL } from 'lib/constants'
import { usePathname } from 'next/navigation'
import { useCallback } from 'react'

export function useSendTelemetryEvent() {
  const pathname = usePathname()

  return useCallback(
    (event: TelemetryEvent) => {
      const url = new URL(API_URL ?? 'http://localhost:3000')
      url.pathname = pathname ?? ''
      url.search = window.location.search

      return sendTelemetryEvent(API_URL, event, url.toString())
    },
    [pathname]
  )
}
