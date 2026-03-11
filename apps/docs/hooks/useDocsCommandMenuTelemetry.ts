'use client'

import { useCallback } from 'react'

import type {
  CommandMenuClosedEvent,
  CommandMenuCommandClickedEvent,
  CommandMenuOpenedEvent,
  CommandMenuSearchSubmittedEvent,
} from 'common/telemetry-constants'
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
      sendTelemetryEvent(event)
    },
    [sendTelemetryEvent, hasAcceptedConsent]
  )

  return { onTelemetry }
}
