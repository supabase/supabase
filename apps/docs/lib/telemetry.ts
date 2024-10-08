import { usePathname } from 'next/navigation'

import { useConsent } from 'ui-patterns/ConsentToast'

import { unauthedAllowedPost } from './fetch/fetchWrappers'
import { useRouter } from 'next/router'
import { isBrowser } from 'common'

type TelemetryEvent = {
  action: string
  category: string
  label: string
}

const noop = () => {}

/**
 * Sends a telemetry event to Logflare for tracking by the product team.
 *
 * Checks for user consent to telemetry before sending.
 */
const useSendTelemetryEvent = () => {
  const router = useRouter()
  const { hasAcceptedConsent } = useConsent()
  const pathname = usePathname()

  if (!hasAcceptedConsent) return noop

  const title = typeof document !== 'undefined' ? document?.title : ''
  const referrer = typeof document !== 'undefined' ? document?.referrer : ''

  return (event: TelemetryEvent) =>
    unauthedAllowedPost('/platform/telemetry/event', {
      body: {
        action: event.action,
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
        custom_properties: {},
      },
      headers: { Version: '2' },
    })
      .then(({ error }) => {
        if (error) console.error(error)
      })
      .catch((error) => console.error(error))
}

export { useSendTelemetryEvent }
