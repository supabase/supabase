'use client'

import { useRouter } from 'next/compat/router'
import { isBrowser } from '../helpers'

export interface TelemetryProps {
  screenResolution?: string
  page_url: string
  search: string
  language: string
  viewport_height: number
  viewport_width: number
}

export function useTelemetryProps(): TelemetryProps {
  const router = useRouter()
  const locale = router ? router.locale : undefined

  return {
    screenResolution: isBrowser ? `${window.innerWidth}x${window.innerHeight}` : undefined,
    page_url: isBrowser ? window.location.href : '',
    search: isBrowser ? window.location.search : '',
    viewport_height: isBrowser ? window.innerHeight : 0,
    viewport_width: isBrowser ? window.innerWidth : 0,
    language: locale ?? 'en-US',
  }
}
