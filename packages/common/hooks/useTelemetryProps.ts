'use client'

import { useRouter } from 'next/compat/router'
import { isBrowser } from '../helpers'

export function useTelemetryProps() {
  const router = useRouter()
  const locale = router ? router.locale : undefined
  return {
    language: locale ?? 'en-US',
    search: isBrowser ? window.location.search : undefined,
    userAgent: isBrowser ? window.navigator.userAgent : undefined,
    viewportHeight: isBrowser ? window.innerHeight : undefined,
    viewportWidth: isBrowser ? window.innerWidth : undefined,
  }
}
