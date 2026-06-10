'use client'

import { Check, Copy } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import {
  Button,
  copyToClipboard,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from 'ui'

interface AgentPlanSheetProps {
  open: boolean
  plan: string
  onOpenChange: (open: boolean) => void
}

/** Renders the plan, tinting markdown heading lines with the brand color. */
function renderPlan(plan: string) {
  return plan.split('\n').map((line, i) => {
    const isHeading = line.startsWith('#')
    return (
      <Fragment key={i}>
        <span className={isHeading ? 'font-semibold text-brand-600' : undefined}>{line}</span>
        {'\n'}
      </Fragment>
    )
  })
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
        <SheetHeader className="flex items-baseline gap-2">
          <SheetTitle className="text-[15px] font-semibold">Agent plan</SheetTitle>
          <span className="text-[13px] text-foreground-light">generated from your setup</span>
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
            {copied ? 'Copied' : 'Copy prompt'}
          </Button>
          <span className="text-[12.5px] text-foreground-muted">
            Paste into Claude Code, Codex, or any MCP-aware agent.
          </span>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
