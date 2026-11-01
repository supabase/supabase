'use client'

import type { FocusEvent, ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface DockTooltipProps {
  label: string
  children: ReactElement
}

const handleTooltipTriggerFocus = (event: FocusEvent<HTMLElement>) => {
  if (!event.currentTarget.matches(':focus-visible')) event.preventDefault()
}

export const DockTooltip = ({ label, children }: DockTooltipProps) => (
  <Tooltip delayDuration={400}>
    <TooltipTrigger asChild onFocus={handleTooltipTriggerFocus}>
      {children}
    </TooltipTrigger>
    <TooltipContent className="max-w-[240px]">{label}</TooltipContent>
  </Tooltip>
)
