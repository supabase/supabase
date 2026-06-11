'use client'

import { BookOpen, Bot, Check, FileText } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button, copyToClipboard } from 'ui'

interface ConfigRailOutcomeActionsProps {
  plan: string
  hasComposition: boolean
  onOpenManual: () => void
  onOpenAgentPlan: () => void
}

export function ConfigRailStickyFooter({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 shrink-0 bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-full z-10 h-10 bg-linear-to-t from-background to-transparent"
      />
      <div className="space-y-2 px-8 pb-8 pt-4">{children}</div>
    </div>
  )
}

export function ConfigRailOutcomeActions({
  plan,
  hasComposition,
  onOpenManual,
  onOpenAgentPlan,
}: ConfigRailOutcomeActionsProps) {
  const [copiedPlan, setCopiedPlan] = useState(false)

  function handleCopyPlan() {
    copyToClipboard(plan, () => {
      setCopiedPlan(true)
      window.setTimeout(() => setCopiedPlan(false), 2000)
    })
  }

  return (
    <>
      <div className="flex w-full items-center">
        <Button
          type="primary"
          className="min-w-0 flex-1 rounded-r-none"
          disabled={!hasComposition}
          icon={copiedPlan ? <Check /> : <Bot />}
          onClick={handleCopyPlan}
        >
          {copiedPlan ? 'Copied' : 'Copy Agent Prompt'}
        </Button>
        <Button
          type="primary"
          className="shrink-0 rounded-l-none px-2.5 -ml-px"
          disabled={!hasComposition}
          icon={<FileText />}
          aria-label="View agent prompt"
          onClick={onOpenAgentPlan}
        />
      </div>
      <Button type="default" block icon={<BookOpen />} onClick={onOpenManual}>
        Implement yourself
      </Button>
    </>
  )
}
