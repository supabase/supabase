'use client'

import { Sheet, SheetContent, SheetTitle } from 'ui'

import type { SetupStep } from '../lib/steps'
import { SetupGuide } from './SetupGuide'

interface SetupGuideSheetProps {
  open: boolean
  steps: SetupStep[]
  frameworkLabel: string
  onOpenChange: (open: boolean) => void
}

export function SetupGuideSheet({
  open,
  steps,
  frameworkLabel,
  onOpenChange,
}: SetupGuideSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg" className="flex flex-col gap-0 overflow-hidden p-0">
        <SheetTitle className="sr-only">Implement your backend</SheetTitle>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-12">
          <div className="mx-auto w-full max-w-prose">
            <SetupGuide steps={steps} frameworkLabel={frameworkLabel} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
