'use client'

import { BookOpen, Bot, Check } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button, cn, copyToClipboard } from 'ui'

interface ConfigRailOutcomeActionsProps {
  plan: string
  hasComposition: boolean
  onOpenManual: () => void
}

export function ConfigRailStickyFooter({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="relative z-10 shrink-0 bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-full z-10 h-10 bg-linear-to-t from-background to-transparent"
      />
      <div className={cn('space-y-2 px-8 pb-8 pt-4', className)}>{children}</div>
    </div>
  )
}

export function ConfigRailOutcomeActions({
  plan,
  hasComposition,
  onOpenManual,
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
      <Button
        type="primary"
        block
        disabled={!hasComposition}
        icon={copiedPlan ? <Check /> : <Bot />}
        onClick={handleCopyPlan}
      >
        {copiedPlan ? 'Copied' : 'Copy plan'}
      </Button>
      <Button type="outline" block icon={<BookOpen />} onClick={onOpenManual}>
        Implement yourself
      </Button>
    </>
  )
}
