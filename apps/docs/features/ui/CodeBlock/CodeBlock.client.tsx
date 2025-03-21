'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { cn } from 'ui'

export function CodeCopyButton({ className, content }: { className?: string; content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    } catch (error) {
      console.error('Failed to copy text: ', error)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'border rounded-md p-1',
        copied && 'bg-selection',
        'hover:bg-selection transition',
        className
      )}
    >
      {copied ? (
        <Check size={14} className="text-lighter" />
      ) : (
        <Copy size={14} className="text-lighter" />
      )}
    </button>
  )
}
