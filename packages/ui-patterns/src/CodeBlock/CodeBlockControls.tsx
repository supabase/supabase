'use client'

import { ArrowRightFromLine, Check, Copy, WrapText, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, cn, copyToClipboard, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

function CrossfadeIcon({
  active,
  activeIcon: ActiveIcon,
  inactiveIcon: InactiveIcon,
}: {
  active: boolean
  activeIcon: LucideIcon
  inactiveIcon: LucideIcon
}) {
  const iconClass = (shown: boolean) =>
    cn(
      'absolute inset-0 m-auto text-lighter group-hover/btn:text-foreground',
      'transition-[opacity,scale,filter,color] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)]',
      'motion-reduce:transition-none',
      shown ? 'opacity-100 scale-100 blur-none' : 'opacity-0 scale-[0.25] blur-[4px]'
    )

  return (
    <span className="relative block size-3.5">
      <ActiveIcon size={14} aria-hidden="true" className={iconClass(active)} />
      <InactiveIcon size={14} aria-hidden="true" className={iconClass(!active)} />
    </span>
  )
}

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
            // Tooltip repeats the label; screen readers would read it twice
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

export function CodeBlockControls({ content }: { content: string }) {
  const [isWrapped, setIsWrapped] = useState(false)
  // Empty until the first toggle, so nothing is announced on mount
  const [wrapStatus, setWrapStatus] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  const toggleWrap = useCallback(() => {
    const newValue = !isWrapped
    setIsWrapped(newValue)
    setWrapStatus(newValue ? 'Word wrap enabled' : 'Word wrap disabled')

    const codeBlock = wrapperRef.current?.closest('.shiki')
    if (codeBlock) {
      if (newValue) {
        codeBlock.setAttribute('data-wrapped', 'true')
      } else {
        codeBlock.removeAttribute('data-wrapped')
      }
    }
  }, [isWrapped])

  return (
    <div
      ref={wrapperRef}
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
            onClick={toggleWrap}
            className={cn(
              'group/btn size-6 p-1 cursor-pointer bg-200 hover:border-strong',
              'hover:bg-[var(--btn-active)]'
            )}
            aria-label={isWrapped ? 'Disable word wrap' : 'Enable word wrap'}
            // Tooltip repeats the label; screen readers would read it twice
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
