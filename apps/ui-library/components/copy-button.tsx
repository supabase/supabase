'use client'

import { Check, Copy } from 'lucide-react'
import * as React from 'react'

import { Button, cn, copyToClipboard } from 'ui'

interface CopyButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string
  src?: string
}

export function CopyButton({ value, className, src, ...props }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false)
    }, 2000)
  }, [hasCopied])

  return (
    <Button
      size="small"
      type="outline"
      className={cn(
        'relative z-10 h-6 w-6 text-foreground-muted hover:bg-surface-100 hover:text-foreground p-0',
        className
      )}
      onClick={() => {
        copyToClipboard(value)
        setHasCopied(true)
      }}
      {...props}
    >
      <span className="sr-only">Copy</span>
      {hasCopied ? <Check className="h-3 w-3 text-brand-600" /> : <Copy className="h-3 w-3" />}
    </Button>
  )
}
