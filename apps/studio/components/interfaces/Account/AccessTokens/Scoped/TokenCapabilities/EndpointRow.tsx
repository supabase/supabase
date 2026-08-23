import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn, copyToClipboard } from 'ui'

import { splitEndpointPath } from './TokenCapabilities.utils'

interface EndpointRowProps {
  method: string
  path: string
  /** Shared leading segments across the group, rendered muted ahead of the distinguishing part. */
  sharedPrefix: string
  /** Sized by the caller for the longest method present in the group. */
  methodColumnWidth: string
}

/**
 * One copyable endpoint. The muted prefix span shrinks with an end-ellipsis while the
 * distinguishing segment stays fixed-width — visually equivalent to truncating the full path in
 * its middle, without needing to measure pixel widths. A distinguishing segment too long for the
 * row clips at the right instead, so hovering (or focusing) pans the path sideways to bring the
 * clipped tail into view. Clicking copies the path — the pasteable part; the method is visible
 * context.
 */
export const EndpointRow = ({
  method,
  path,
  sharedPrefix,
  methodColumnWidth,
}: EndpointRowProps) => {
  const { prefix, distinguishing } = splitEndpointPath(path, sharedPrefix)

  const pathContainerRef = useRef<HTMLSpanElement>(null)
  const [isCopied, setIsCopied] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [showCopiedIcon, setShowCopiedIcon] = useState(false)

  useEffect(() => () => clearTimeout(copiedTimerRef.current), [])

  const handleCopy = () => {
    copyToClipboard(path, () => {
      setIsCopied(true)
      setShowCopiedIcon(true)
      clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setShowCopiedIcon(false), 2000)
    })
  }

  return (
    <button
      type="button"
      tabIndex={0}
      onClick={handleCopy}
      aria-label={`Copy ${method} ${path}`}
      className="group flex w-full items-center gap-2 py-1.5 text-left"
    >
      <span
        className="shrink-0 font-mono text-xs text-foreground-lighter"
        style={{ width: methodColumnWidth }}
      >
        {method}
      </span>
      <span
        ref={pathContainerRef}
        className={cn(
          'block inline-full overflow-hidden',
          // group allows to have the hover effect on children (see below)
          'group',
          // container to allow hover effect size computations
          '@container',
          '[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]'
        )}
      >
        <span
          className={cn(
            'font-mono text-xs',
            // This is necessary for the reveal on hover animation
            'block inline-[max-content] whitespace-nowrap text-nowrap',
            'transition-transform ease-linear motion-reduce:transition-none duration-1000 delay-400',
            // This ensure no GPU jump when non-scrolling items are hovered
            'translate-0',
            // If the content (102% to have a small right margin) exceeds the container size (100cqi), the calc result will be a negative number
            // This ensures small items don't translate
            'group-hover:translate-x-[min(0px,calc(100cqi-102%))]'
          )}
        >
          <span>
            {prefix !== '' && (
              <span className="overflow-hidden text-ellipsis text-foreground-lighter">
                {prefix}
              </span>
            )}
            <span className="shrink-0 text-foreground">{distinguishing}</span>
          </span>
        </span>
      </span>
      <span className="shrink-0 pl-2">
        {showCopiedIcon ? (
          <Check size={14} className="text-brand" />
        ) : (
          <Copy
            size={14}
            className="text-foreground-lighter opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          />
        )}
      </span>
      <span className="sr-only" aria-live="polite">
        {isCopied ? 'URL copied' : null}
      </span>
    </button>
  )
}
