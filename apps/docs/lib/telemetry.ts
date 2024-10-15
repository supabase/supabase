import { usePathname } from 'next/navigation'

import { useConsent } from 'ui-patterns/ConsentToast'

import { unauthedAllowedPost } from './fetch/fetchWrappers'

import { Telemetry } from 'telemetry'

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

  return (event: Telemetry.EventWithProperties) =>
    unauthedAllowedPost('/platform/telemetry/event', {
      // @ts-ignore - endpoint will accept this just fine
      body: {
        action: event.action,
        // @ts-ignore To be fixed for PH
        custom_properties: event.properties,
        page_title: document?.title,
        // @ts-ignore [JOSHEN] To be fixed for PH
        page_location: pathname,
      },
    })
      .then(({ error }) => {
        if (error) console.error(error)
      })
      .catch((error) => console.error(error))
}

export { useSendTelemetryEvent }
