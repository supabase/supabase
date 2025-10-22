'use client'

import { useCallback } from 'react'

import type {
  CommandMenuOpenedEvent,
  CommandMenuCommandSelectedEvent,
  CommandMenuInputTypedEvent,
} from 'common/telemetry-constants'
import { useSendTelemetryEvent } from 'lib/telemetry'

export function useDocsCommandMenuTelemetry() {
  const sendTelemetryEvent = useSendTelemetryEvent()

  const onTelemetry = useCallback(
    (
      event: CommandMenuOpenedEvent | CommandMenuCommandSelectedEvent | CommandMenuInputTypedEvent
    ) => {
      sendTelemetryEvent(event)
    },
    [sendTelemetryEvent]
  )

  return { onTelemetry }
}
