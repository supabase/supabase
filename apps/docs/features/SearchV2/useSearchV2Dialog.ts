'use client'

import type { DocsSearchV2ClosedEvent, DocsSearchV2OpenedEvent } from 'common/telemetry-constants'
import { useCallback, useState } from 'react'

import { useSendTelemetryEvent } from '@/lib/telemetry'

type SearchV2TriggerType = DocsSearchV2OpenedEvent['properties']['triggerType']

export type SearchV2CloseReason = DocsSearchV2ClosedEvent['properties']['closeReason']

/**
 * Open state for the Search V2 dialog, with its opened/closed telemetry.
 * Pass the result to `SearchV2Dialog`, and call `openDialog` from whatever opens it.
 */
export function useSearchV2Dialog() {
  const [open, setOpen] = useState(false)
  const sendTelemetryEvent = useSendTelemetryEvent()

  const openDialog = useCallback(
    (triggerType: SearchV2TriggerType) => {
      setOpen(true)
      sendTelemetryEvent({ action: 'docs_search_v2_opened', properties: { triggerType } })
    },
    [sendTelemetryEvent]
  )

  // the dialog reports a plain close, which is a dismissal
  const handleOpenChange = useCallback(
    (next: boolean, closeReason: SearchV2CloseReason = 'dismissed') => {
      setOpen(next)
      if (!next) {
        sendTelemetryEvent({ action: 'docs_search_v2_closed', properties: { closeReason } })
      }
    },
    [sendTelemetryEvent]
  )

  return { open, openDialog, handleOpenChange }
}
