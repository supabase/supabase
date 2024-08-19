'use client'

import { useTelemetryProps } from 'common'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { useConsent } from 'ui-patterns/ConsentToast'
import { BASE_PATH, IS_PLATFORM } from '~/lib/constants'
import { unauthedAllowedPost } from '~/lib/fetch/fetchWrappers'

const useSendPageTelemetryWithConsent = () => {
  const { hasAcceptedConsent } = useConsent()
  const telemetryProps = useTelemetryProps()

  const sendPageTelemetry = useCallback(
    (route: string) => {
      if (!(IS_PLATFORM && hasAcceptedConsent)) return

      unauthedAllowedPost('/platform/telemetry/page', {
        body: {
          referrer: document.referrer,
          title: document.title,
          route: `${BASE_PATH}${route}`,
          ga: {
            screen_resolution: telemetryProps?.screenResolution,
            language: telemetryProps?.language,
            session_id: '',
          },
        },
      }).catch((e) => {
        console.error('Problem sending telemetry:', e)
      })
    },
    [telemetryProps, hasAcceptedConsent]
  )

  return sendPageTelemetry
}

const PageTelemetry = () => {
  const pathname = usePathname()
  const sendPageTelemetry = useSendPageTelemetryWithConsent()

  useEffect(() => {
    if (pathname) {
      sendPageTelemetry(pathname)
    }
  }, [pathname, sendPageTelemetry])

  return null
}

export { PageTelemetry }
