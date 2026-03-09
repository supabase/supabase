'use client'

import { useCallback } from 'react'

import type {
  CommandMenuClosedEvent,
  CommandMenuCommandClickedEvent,
  CommandMenuOpenedEvent,
  CommandMenuSearchSubmittedEvent,
} from 'common/telemetry-constants'
import { posthogClient } from 'common'
import { useConsentToast } from 'ui-patterns/consent'
import { useSendTelemetryEvent } from '@/lib/telemetry'

export function useDocsCommandMenuTelemetry() {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const { hasAcceptedConsent } = useConsentToast()
  const onTelemetry = useCallback(
    (
      event:
      | CommandMenuOpenedEvent
      | CommandMenuClosedEvent
      | CommandMenuCommandClickedEvent
      | CommandMenuSearchSubmittedEvent
    ) => {
      console.log('--- hasAcceptedConsent ---', hasAcceptedConsent)
      console.log('EVENT', event)
      sendTelemetryEvent(event)
      posthogClient.capture(event.action, event.properties, hasAcceptedConsent)
    },
    [sendTelemetryEvent, hasAcceptedConsent]
  )

  return { onTelemetry }
}
