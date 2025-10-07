'use client'

import { usePathname } from 'next/navigation'
import { useCallback } from 'react'

import { sendTelemetryEvent } from 'common'
import { TelemetryEvent } from 'common'
import { API_URL } from 'lib/constants'

export function useSendTelemetryEvent() {
  const pathname = usePathname()

  return useCallback(
    (event: TelemetryEvent) => {
      return sendTelemetryEvent(API_URL, event, pathname)
    },
    [pathname]
  )
}
