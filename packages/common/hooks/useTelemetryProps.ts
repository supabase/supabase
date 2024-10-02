'use client'

import { useRouter } from 'next/compat/router'
import { isBrowser } from '../helpers'

export function useTelemetryProps() {
  const router = useRouter()
  const locale = router ? router.locale : undefined
  return {
    screenResolution: isBrowser ? `${window.innerWidth}x${window.innerHeight}` : undefined,
    language: locale ?? 'en-US',
    userAgent: isBrowser ? window.navigator.userAgent : undefined,
    search: isBrowser ? window.location.search : undefined,
  }
}
