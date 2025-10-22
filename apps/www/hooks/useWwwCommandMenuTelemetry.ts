import { useCallback } from 'react'

import type {
  CommandMenuOpenedEvent,
  CommandMenuCommandSelectedEvent,
  CommandMenuInputTypedEvent,
} from 'common/telemetry-constants'
import { useSendTelemetryEvent } from 'lib/telemetry'

export function useWwwCommandMenuTelemetry() {
  const sendTelemetryEvent = useSendTelemetryEvent()
  console.log('WWW CommandMenu telemetry hook initialized')

  const onTelemetry = useCallback(
    (
      event: CommandMenuOpenedEvent | CommandMenuCommandSelectedEvent | CommandMenuInputTypedEvent
    ) => {
      console.log('WWW CommandMenu telemetry event:', event)
      sendTelemetryEvent(event)
    },
    [sendTelemetryEvent]
  )

  return { onTelemetry }
}
