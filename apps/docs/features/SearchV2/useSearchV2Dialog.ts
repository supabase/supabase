'use client'

import type { DocsSearchV2OpenedEvent } from 'common/telemetry-constants'
import { useCallback, useState } from 'react'

import { useSendTelemetryEvent } from '@/lib/telemetry'

type SearchV2TriggerType = DocsSearchV2OpenedEvent['properties']['triggerType']

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

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) {
        sendTelemetryEvent({ action: 'docs_search_v2_closed' })
      }
    },
    [sendTelemetryEvent]
  )

  return { open, openDialog, handleOpenChange }
}
