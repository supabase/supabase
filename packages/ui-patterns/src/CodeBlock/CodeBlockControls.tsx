'use client'

import { ArrowRightFromLine, Check, Copy, WrapText } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Button,
  cn,
  copyToClipboard,
  CrossfadeIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

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
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return

    const timeout = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [copied])

  const handleCopy = async () => {
    copyToClipboard(content, () => {
      setCopied(true)
      onCopied?.()
    })
  }

  const resetStatus = () => {
    setCopied(false)
  }

  return (
    <>
      <span className="sr-only" aria-live="polite">
        {copied ? copiedLabel : ''}
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
              copied && 'bg-[var(--btn-active)]',
              'hover:bg-[var(--btn-active)]',
              className
            )}
            aria-label={label}
            // the tooltip repeats the label, so screen readers read it twice
            aria-describedby={undefined}
          >
            <CrossfadeIcon active={copied} activeIcon={Check} inactiveIcon={Copy} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </>
  )
}

export function CodeBlockControls({
  content,
  defaultWrapped = false,
}: {
  content: string
  defaultWrapped?: boolean
}) {
  const [isWrapped, setIsWrapped] = useState(defaultWrapped)
  // Empty until the first toggle, so nothing is announced on mount
  const [wrapStatus, setWrapStatus] = useState('')

  const handleWrapToggle = () => {
    const newValue = !isWrapped
    setIsWrapped(newValue)
    setWrapStatus(newValue ? 'Word wrap enabled' : 'Word wrap disabled')
  }

  return (
    // code-block.css finds the frame from this flag, so the controls do not change the frame
    <div
      data-wrapped={isWrapped ? 'true' : undefined}
      className={cn(
        'opacity-0 flex group-hover:opacity-100 group-focus-within:opacity-100 absolute top-[9.5px] right-[9.5px] gap-1',
        '[--btn-active:color-mix(in_srgb,var(--foreground)_4%,var(--background-200))]'
      )}
    >
      <span className="sr-only" aria-live="polite">
        {wrapStatus}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            tabIndex={0}
            onClick={handleWrapToggle}
            className={cn(
              'group/btn size-6 p-1 cursor-pointer bg-200 hover:border-strong',
              'hover:bg-[var(--btn-active)]'
            )}
            aria-label={isWrapped ? 'Disable word wrap' : 'Enable word wrap'}
            // the tooltip repeats the label, so screen readers read it twice
            aria-describedby={undefined}
          >
            <CrossfadeIcon
              active={isWrapped}
              activeIcon={ArrowRightFromLine}
              inactiveIcon={WrapText}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isWrapped ? 'Disable word wrap' : 'Enable word wrap'}</TooltipContent>
      </Tooltip>
      <CodeCopyButton content={content} />
    </div>
  )
}
