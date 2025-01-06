'use client'

import { useRouter } from 'next/compat/router'
import { usePathname } from 'next/navigation'
import { isBrowser } from '../helpers'

export interface TelemetryProps {
  screenResolution?: string
  page_url: string
  pathname: string
  search: string
  language: string
  viewport_height: number
  viewport_width: number
}

export function useTelemetryProps(): TelemetryProps {
  const router = useRouter()
  const pathname = usePathname()
  const locale = router ? router.locale : undefined

  return {
    screenResolution: isBrowser ? `${window.innerWidth}x${window.innerHeight}` : undefined,
    page_url: isBrowser ? window.location.href : '',
    pathname: router?.pathname ?? pathname ?? window.location.pathname,
    search: isBrowser ? window.location.search : '',
    viewport_height: isBrowser ? window.innerHeight : 0,
    viewport_width: isBrowser ? window.innerWidth : 0,
    language: locale ?? 'en-US',
  }
}
