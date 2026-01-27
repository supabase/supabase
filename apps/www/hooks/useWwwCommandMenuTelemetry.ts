import type {
  CommandMenuCommandClickedEvent,
  CommandMenuOpenedEvent,
  CommandMenuSearchSubmittedEvent,
} from 'common/telemetry-constants'
import { useSendTelemetryEvent } from 'lib/telemetry'
import { useCallback } from 'react'

export function useWwwCommandMenuTelemetry() {
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
