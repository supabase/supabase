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
  const { hasAcceptedConsent } = useConsent()
  const pathname = usePathname()

  if (!hasAcceptedConsent) return noop

  return (event: TelemetryEvent) =>
    unauthedAllowedPost('/platform/telemetry/event', {
      // @ts-ignore - endpoint will accept this just fine
      body: {
        ...event,
        page_title: document?.title,
        page_location: pathname,
      },
    })
      .then(({ error }) => {
        if (error) console.error(error)
      })
      .catch((error) => console.error(error))
}

export { useSendTelemetryEvent }
