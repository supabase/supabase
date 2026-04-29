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
      // Read live search params here instead of via `useSearchParams()` at
      // the top of the hook. `useSearchParams()` forces every component that
      // calls this hook (Nav, PricingPlans, CTABanner, …) to bail out to
      // client-side rendering, hiding the page from crawlers (FE-3079). The
      // callback only fires on user events, so window is always available.
      url.search = typeof window !== 'undefined' ? window.location.search : ''

      return sendTelemetryEvent(API_URL, event, url.toString())
    },
    [pathname]
  )
}
