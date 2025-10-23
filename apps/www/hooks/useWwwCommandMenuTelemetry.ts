import { useCallback } from 'react'

import type {
  CommandMenuOpenedEvent,
  CommandMenuCommandSelectedEvent,
  CommandMenuSearchSubmittedEvent,
} from 'common/telemetry-constants'
import { useSendTelemetryEvent } from 'lib/telemetry'

export function useWwwCommandMenuTelemetry() {
  const sendTelemetryEvent = useSendTelemetryEvent()

  const onTelemetry = useCallback(
    (
      event:
        | CommandMenuOpenedEvent
        | CommandMenuCommandSelectedEvent
        | CommandMenuSearchSubmittedEvent
    ) => {
      sendTelemetryEvent(event)
    },
    [sendTelemetryEvent]
  )

  return { onTelemetry }
}
