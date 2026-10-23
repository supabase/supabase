'use client'

import { CheckIcon, CopyIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, cn, copyToClipboard, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { CrossfadeIcon } from './CrossfadeIcon'

export function CodeCopyButton({
  className,
  content,
  label = 'Copy code',
  copiedLabel = 'Code copied',
  onCopied,
}: {
  className?: string
  content: string
  label?: string
  copiedLabel?: string
  /** Runs after a successful clipboard write. */
  onCopied?: () => void
}) {
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) return

    const timeout = window.setTimeout(() => setIsCopied(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [isCopied])

  const handleCopy = () => {
    copyToClipboard(content, () => {
      setIsCopied(true)
      onCopied?.()
    })
  }

  const resetStatus = () => {
    setIsCopied(false)
  }

  return (
    <>
      <span className="sr-only" aria-live="polite">
        {isCopied ? copiedLabel : ''}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            tabIndex={0}
            onClick={handleCopy}
            onBlur={resetStatus}
            className={cn(
              'group/btn size-6 p-1 cursor-pointer bg-200 hover:border-strong',
              isCopied && 'bg-(--btn-active)',
              'hover:bg-(--btn-active)',
              className
            )}
            aria-label={label}
            // Tooltip repeats the label; screen readers would read it twice
            aria-describedby={undefined}
          >
            <CrossfadeIcon active={isCopied} activeIcon={CheckIcon} inactiveIcon={CopyIcon} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </>
  )
}
