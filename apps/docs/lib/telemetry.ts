import { usePathname } from 'next/navigation'

import { IS_PROD, useTelemetryProps } from 'common'
import { useConsent } from 'ui-patterns/ConsentToast'

import { DEBUG_TELEMETRY } from './constants'
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
  const telemetryProps = useTelemetryProps()

  if (!IS_PROD && !DEBUG_TELEMETRY) return noop
  if (!hasAcceptedConsent) return noop

  return (event: TelemetryEvent) => unauthedAllowedPost('/platform/telemetry/event', {
    body: {
      ...event,
      page_title: document?.title,
      page_location: pathname,
      // @ts-ignore -- fine to not send session_id
      ga: telemetryProps
    },
  })
}

export { useSendTelemetryEvent }