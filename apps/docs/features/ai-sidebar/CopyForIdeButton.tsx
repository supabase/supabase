'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { Check, Copy } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button, copyToClipboard } from 'ui'

import { formatContextForExport } from './formatContextForExport'
import { useDocsAiSidebar } from './DocsAiSidebarContext'

function CopyForIdeButton({ className }: { className?: string }) {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const { codeContext, isCodeContextEnabled, messages } = useDocsAiSidebar()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    const text = formatContextForExport({ codeContext, isCodeContextEnabled, messages })
    copyToClipboard(text, () => {
      setCopied(true)
      sendTelemetryEvent({ action: 'copy_ai_context_clicked' })
      setTimeout(() => setCopied(false), 2000)
    })
  }, [codeContext, isCodeContextEnabled, messages, sendTelemetryEvent])

  return (
    <Button
      type="text"
      size="tiny"
      icon={copied ? <Check size={14} /> : <Copy size={14} />}
      onClick={handleCopy}
      className={className}
    >
      {copied ? 'Copied!' : 'Copy for IDE'}
    </Button>
  )
}

export { CopyForIdeButton }
