'use client'

import { ReactNode } from 'react'
import { Accordion_Shadcn_ as Accordion, cn } from 'ui'

import { useTrack } from '@/lib/telemetry/track'

interface TroubleshootingAccordionProps {
  children: ReactNode
  /** Error mapping ID — used for telemetry */
  errorType: string
  /** Step titles keyed by step number — used for telemetry */
  stepTitles?: Record<number, string>
  /** Which step to expand by default (1-indexed), defaults to 1 */
  defaultExpandedStep?: number
  className?: string
}

export function TroubleshootingAccordion({
  children,
  errorType,
  stepTitles,
  defaultExpandedStep = 1,
  className,
}: TroubleshootingAccordionProps) {
  const track = useTrack()
  const defaultValue = defaultExpandedStep > 0 ? `step-${defaultExpandedStep}` : undefined

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultValue}
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
