'use client'

import { useRouter } from 'next/compat/router'
import { isBrowser } from '../helpers'

export function useTelemetryProps() {
  const router = useRouter()
  const locale = router ? router.locale : undefined

  return {
    screenResolution: isBrowser ? `${window.innerWidth}x${window.innerHeight}` : undefined,
    page_url: window.location.href,
    search: window.location.search,
    viewport_height: window.innerHeight,
    viewport_width: window.innerWidth,
    language: locale ?? 'en-US',
  }
}
