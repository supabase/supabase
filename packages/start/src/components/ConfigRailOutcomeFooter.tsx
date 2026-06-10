'use client'

import { BookOpen, Bot, Check, Download, FileText } from 'lucide-react'
import { useState } from 'react'
import { Button, copyToClipboard } from 'ui'

interface ConfigRailOutcomeFooterProps {
  plan: string
  hasComposition: boolean
  onDownload: () => void
  onOpenManual: () => void
  onOpenAgentPlan: () => void
}

export function ConfigRailOutcomeFooter({
  plan,
  hasComposition,
  onDownload,
  onOpenManual,
  onOpenAgentPlan,
}: ConfigRailOutcomeFooterProps) {
  const [copiedPlan, setCopiedPlan] = useState(false)

  function handleCopyPlan() {
    copyToClipboard(plan, () => {
      setCopiedPlan(true)
      window.setTimeout(() => setCopiedPlan(false), 2000)
    })
  }

  return (
    <div className="relative z-10 shrink-0 bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-full z-10 h-10 bg-linear-to-t from-background to-transparent"
      />
      <div className="space-y-2 px-4 pb-4 pt-2">
        <div className="flex items-center gap-2">
          <Button
            type="primary"
            className="min-w-0 flex-1"
            disabled={!hasComposition}
            icon={copiedPlan ? <Check /> : <Bot />}
            onClick={handleCopyPlan}
          >
            {copiedPlan ? 'Copied' : 'Copy Agent Prompt'}
          </Button>
          <Button
            type="default"
            className="shrink-0 px-2.5"
            disabled={!hasComposition}
            icon={<FileText />}
            aria-label="View agent prompt"
            onClick={onOpenAgentPlan}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="default"
            block
            disabled={!hasComposition}
            icon={<Download />}
            onClick={onDownload}
          >
            Code
          </Button>
          <Button type="default" block icon={<BookOpen />} onClick={onOpenManual}>
            Manual
          </Button>
        </div>
      </div>
    </div>
  )
}
