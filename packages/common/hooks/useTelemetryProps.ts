'use client'

import { useRouter } from 'next/compat/router'
import { isBrowser } from '../helpers'

export function useTelemetryProps() {
  const router = useRouter()
  const locale = router ? router.locale : undefined
  return {
    language: locale ?? 'en-US',
    search: isBrowser ? window.location.search : undefined,
    user_agent: isBrowser ? window.navigator.userAgent : undefined,
    viewport_height: isBrowser ? window.innerHeight : undefined,
    viewport_width: isBrowser ? window.innerWidth : undefined,
  }
}
