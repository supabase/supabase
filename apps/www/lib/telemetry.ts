'use client'

import { sendTelemetryEvent } from 'common'
import type { TelemetryEvent } from 'common/telemetry-constants'
import { API_URL } from 'lib/constants'
import { usePathname, useSearchParams } from 'next/navigation'

export function useSendTelemetryEvent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (event: TelemetryEvent) => {
    const url = new URL(API_URL ?? 'http://localhost:3000')
    url.pathname = pathname ?? ''
    url.search = searchParams?.toString() ?? ''

    return sendTelemetryEvent(API_URL, event, url.toString())
  }
}
