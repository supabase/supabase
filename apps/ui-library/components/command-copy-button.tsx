'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button_Shadcn_ } from 'ui'

export function CommandCopyButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  return (
    <Button_Shadcn_
      variant="ghost"
      size="icon"
      onClick={() => {
        navigator.clipboard.writeText(command)
        setCopied(true)
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button_Shadcn_>
  )
}
