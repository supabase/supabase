'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from 'ui'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
        'border-default bg-surface-100 text-foreground-lighter hover:bg-surface-200 hover:text-foreground'
      )}
      title={`Copy: ${text}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
