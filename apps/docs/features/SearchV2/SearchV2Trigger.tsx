'use client'

import { SearchTrigger, useSearchShortcut, type SearchTriggerProps } from 'docs-search/components'
import { useCallback, useState } from 'react'

import { SearchV2Dialog } from './SearchV2Dialog'
import { useSendTelemetryEvent } from '@/lib/telemetry'

type SearchV2TriggerProps = Pick<SearchTriggerProps, 'className' | 'placeholder'>

export function SearchV2Trigger({ className, placeholder }: SearchV2TriggerProps) {
  const [open, setOpen] = useState(false)
  const sendTelemetryEvent = useSendTelemetryEvent()

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) {
        sendTelemetryEvent({ action: 'docs_search_v2_closed' })
      }
    },
    [sendTelemetryEvent]
  )

  const handleShortcut = useCallback(() => {
    setOpen(true)
    sendTelemetryEvent({
      action: 'docs_search_v2_opened',
      properties: { triggerType: 'keyboard_shortcut' },
    })
  }, [sendTelemetryEvent])

  useSearchShortcut(handleShortcut)

  return (
    <>
      <SearchTrigger
        className={className}
        placeholder={placeholder}
        expanded={open}
        onClick={() => {
          setOpen(true)
          sendTelemetryEvent({
            action: 'docs_search_v2_opened',
            properties: { triggerType: 'search_input' },
          })
        }}
      />
      <SearchV2Dialog open={open} onOpenChange={handleOpenChange} />
    </>
  )
}
