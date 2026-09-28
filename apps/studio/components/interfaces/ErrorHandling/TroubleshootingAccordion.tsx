'use client'

import { ReactNode } from 'react'
import { Accordion, cn } from 'ui'

import { useTrack } from '@/lib/telemetry/track'

interface TroubleshootingAccordionProps {
  children: ReactNode
  /** Error mapping ID — used for telemetry */
  errorType: string
  /** Step titles keyed by step number — used for telemetry */
  stepTitles?: Record<number, string>
  className?: string
}

export function TroubleshootingAccordion({
  children,
  errorType,
  stepTitles,
  className,
}: TroubleshootingAccordionProps) {
  const track = useTrack()

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="step-1"
      className={cn('w-full', className)}
      onValueChange={(value) => {
        const expanded = Boolean(value)
        const step = expanded ? parseInt(value.replace('step-', ''), 10) : null
        track('inline_error_troubleshooter_step_clicked', {
          errorType,
          step,
          stepTitle: step !== null ? stepTitles?.[step] : undefined,
          expanded,
        })
      }}
    >
      {children}
    </Accordion>
  )
}
