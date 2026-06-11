'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Button,
  copyToClipboard,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from 'ui'

import { renderPlan } from '../lib/plan-render'

interface AgentPlanSheetProps {
  open: boolean
  plan: string
  onOpenChange: (open: boolean) => void
}

export function AgentPlanSheet({ open, plan, onOpenChange }: AgentPlanSheetProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) setCopied(false)
  }, [open])

  const copy = () => {
    copyToClipboard(plan, () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-[15px] font-semibold">Agent plan</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <pre className="m-0 whitespace-pre-wrap break-words font-mono text-[12.8px] leading-relaxed text-foreground-light">
            {renderPlan(plan)}
          </pre>
        </div>

        <SheetFooter className="items-center sm:justify-start">
          <Button
            type="primary"
            size="small"
            icon={copied ? <Check size={15} /> : <Copy size={15} />}
            onClick={copy}
          >
            {copied ? 'Copied' : 'Copy plan'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
