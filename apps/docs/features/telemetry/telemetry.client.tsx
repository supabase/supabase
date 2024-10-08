'use client'

import { isBrowser } from 'common'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'
import { useConsent } from 'ui-patterns/ConsentToast'
import { IS_PLATFORM } from '~/lib/constants'
import { unauthedAllowedPost } from '~/lib/fetch/fetchWrappers'

const useSendPageTelemetryWithConsent = () => {
  const router = useRouter()
  const { hasAcceptedConsent } = useConsent()

  const sendPageTelemetry = useCallback(() => {
    if (!(IS_PLATFORM && hasAcceptedConsent)) return

    const title = typeof document !== 'undefined' ? document?.title : ''
    const referrer = typeof document !== 'undefined' ? document?.referrer : ''

    unauthedAllowedPost('/platform/telemetry/page', {
      body: {
        page_url: window.location.href,
        page_title: title,
        pathname: router.pathname,
        ph: {
          referrer,
          language: router?.locale ?? 'en-US',
          userAgent: navigator.userAgent,
          search: window.location.search,
          viewport_height: isBrowser ? window.innerHeight : 0,
          viewport_width: isBrowser ? window.innerWidth : 0,
        },
      },
      headers: { Version: '2' },
    }).catch((e) => {
      console.error('Problem sending telemetry:', e)
    })
  }, [hasAcceptedConsent])

  return sendPageTelemetry
}

const PageTelemetry = () => {
  const pathname = usePathname()
  const sendPageTelemetry = useSendPageTelemetryWithConsent()

  useEffect(() => {
    if (pathname) sendPageTelemetry()
  }, [pathname, sendPageTelemetry])

  return null
}

export { PageTelemetry }
