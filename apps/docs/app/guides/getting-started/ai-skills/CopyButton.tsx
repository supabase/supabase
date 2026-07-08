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
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center rounded-md border p-1.5 transition-colors',
        'border-default bg-surface-100 text-foreground-lighter hover:bg-surface-200 hover:text-foreground'
      )}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}
