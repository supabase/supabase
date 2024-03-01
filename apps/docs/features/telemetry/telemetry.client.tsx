'use client'

import { useTelemetryProps } from 'common'
import { useRouter } from 'next/compat/router'
import { useCallback, useEffect } from 'react'

import { useConsent } from 'ui-patterns/ConsentToast'

import { IS_PLATFORM } from '~/lib/constants'
import { unauthedAllowedPost } from '~/lib/fetch/fetchWrappers'

const useSendPageTelemetryWithConsentCheck = () => {
  const { hasAcceptedConsent } = useConsent()
  const telemetryProps = useTelemetryProps()

  const sendPageTelemetry = useCallback(
    (route: string) => {
      if (!(IS_PLATFORM && hasAcceptedConsent)) return

      unauthedAllowedPost('/platform/telemetry/page', {
        body: {
          referrer: document.referrer,
          title: document.title,
          route,
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

const useTriggerPageTelemetryOnFirstLoad = () => {
  const router = useRouter()
  const sendPageTelemetry = useSendPageTelemetryWithConsentCheck()

  /**
   * [Charis] I suspect this is running too often (copied from existing code),
   * but not going to mess about and potentially break something right now.
   */
  useEffect(() => {
    if (router && router.isReady) {
      sendPageTelemetry(router.basePath + router.asPath)
    }
  }, [router, sendPageTelemetry])
}

const useTriggerPageTelemetryOnPageChange = () => {
  const router = useRouter()
  const sendPageTelemetry = useSendPageTelemetryWithConsentCheck()

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      sendPageTelemetry(url)
    }

    if (router) router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      if (router) router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router, sendPageTelemetry])
}

const PageTelemetry = () => {
  useTriggerPageTelemetryOnFirstLoad()
  useTriggerPageTelemetryOnPageChange()

  return null
}

export { PageTelemetry }
