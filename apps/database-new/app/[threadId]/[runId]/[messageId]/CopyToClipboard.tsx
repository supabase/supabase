'use client'

import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button, IconClipboard } from 'ui'

interface CopyToClipboardProps {
  code: string
}

function copy(code: string) {
  window.navigator?.clipboard?.writeText(code)
}

const CopyToClipboard = ({ code }: CopyToClipboardProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopyClick = () => {
    copy(code)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <Button type="default" onClick={handleCopyClick}>
      <span className="flex gap-2 items-center">
        {copied ? (
          <Check size={12} className="text-lighter" />
        ) : (
          <IconClipboard size={14} strokeWidth={1.5} className="text-lighter" />
        )}
        Copy
      </span>
    </Button>
  )
}

export default CopyToClipboard
