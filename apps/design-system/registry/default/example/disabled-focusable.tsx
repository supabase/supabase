'use client'

import { CirclePause } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

const UNAVAILABLE_REASON = 'Pausing is unavailable on High Availability projects'

export default function DisabledFocusable() {
  const unavailable = true

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="default"
          icon={<CirclePause />}
          disabled={unavailable}
          focusableWhenDisabled
        >
          Pause project
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{UNAVAILABLE_REASON}</TooltipContent>
    </Tooltip>
  )
}
