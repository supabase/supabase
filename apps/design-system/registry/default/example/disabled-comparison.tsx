'use client'

import { CirclePause } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

const UNAVAILABLE_REASON = 'Pausing is unavailable on High Availability projects'

function NativeDisabledButton() {
  const unavailable = true

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="default" icon={<CirclePause />} disabled={unavailable}>
          Pause project
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{UNAVAILABLE_REASON}</TooltipContent>
    </Tooltip>
  )
}

function FocusableDisabledButton() {
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

export default function DisabledComparison() {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">Native disabled</p>
        <p className="text-sm text-foreground-light">
          Removed from the tab order. Keyboard users cannot focus this button or read the tooltip.
        </p>
        <NativeDisabledButton />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Focusable when disabled</p>
        <p className="text-sm text-foreground-light">
          Stays in the tab order. Keyboard users can focus the button and read the tooltip on focus.
        </p>
        <FocusableDisabledButton />
      </div>
    </div>
  )
}
