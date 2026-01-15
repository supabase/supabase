'use client'

import { useCallback } from 'react'

import type {
  CommandMenuOpenedEvent,
  CommandMenuCommandClickedEvent,
  CommandMenuSearchSubmittedEvent,
} from 'common/telemetry-constants'
import { useSendTelemetryEvent } from '@/lib/telemetry'

export function useDocsCommandMenuTelemetry() {
  const sendTelemetryEvent = useSendTelemetryEvent()

  const onTelemetry = useCallback(
    (
      event:
        | CommandMenuOpenedEvent
        | CommandMenuCommandClickedEvent
        | CommandMenuSearchSubmittedEvent
    ) => {
      sendTelemetryEvent(event)
    },
    [sendTelemetryEvent]
  )

  return { onTelemetry }
}
