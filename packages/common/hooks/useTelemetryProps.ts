'use client'

import { useRouter } from 'next/compat/router'
import { isBrowser } from '../helpers'

export function useTelemetryProps() {
  const router = useRouter()
  const locale = router ? router.locale : undefined
  return {
    viewportHeight: isBrowser ? `${window.innerHeight}` : undefined,
    viewportWidth: isBrowser ? `${window.innerWidth}` : undefined,
    language: locale ?? 'en-US',
    userAgent: isBrowser ? window.navigator.userAgent : undefined,
    searchTerms: isBrowser ? window.location.search : undefined,
  }
}
