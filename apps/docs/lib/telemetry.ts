import { isBrowser } from 'common'
import { usePathname } from 'next/navigation'
import { useConsent } from 'ui-patterns/ConsentToast'
import { unauthedAllowedPost } from './fetch/fetchWrappers'

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
  const pathname = usePathname()
  const { hasAcceptedConsent } = useConsent()

  if (!hasAcceptedConsent) return noop

  const title = typeof document !== 'undefined' ? document?.title : ''
  const referrer = typeof document !== 'undefined' ? document?.referrer : ''

  return (event: TelemetryEvent) =>
    unauthedAllowedPost('/platform/telemetry/event', {
      body: {
        pathname,
        action: event.action,
        page_url: isBrowser ? window.location.href : '',
        page_title: title,
        ph: {
          referrer,
          language: navigator.language ?? 'en-US',
          user_agent: navigator.userAgent,
          search: isBrowser ? window.location.search : '',
          viewport_height: isBrowser ? window.innerHeight : 0,
          viewport_width: isBrowser ? window.innerWidth : 0,
        },
        custom_properties: {
          category: event.category,
          label: event.label,
        } as any,
      },
      headers: { Version: '2' },
      credentials: 'include',
    })
      .then(({ error }) => {
        if (error) console.error(error)
      })
      .catch((error) => console.error(error))
}

export { useSendTelemetryEvent }
