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

/** Pan slowly enough to read while revealing (~70px/s), but never snap for short distances. */
const panDurationMs = (distance: number) => Math.max(300, Math.round(distance * 14))

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
  const [panDistance, setPanDistance] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(copiedTimerRef.current), [])

  // Measured when the reveal starts, not on mount: rows live inside accordion content that mounts
  // collapsed, so resting measurements are taken before the row has its real width.
  const handleRevealStart = () => {
    const container = pathContainerRef.current
    if (container) setPanDistance(Math.max(0, container.scrollWidth - container.clientWidth))
    setIsRevealed(true)
  }
  const handleRevealEnd = () => setIsRevealed(false)

  const handleCopy = () => {
    copyToClipboard(path)
    setIsCopied(true)
    clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <button
      type="button"
      tabIndex={0}
      onClick={handleCopy}
      onMouseEnter={handleRevealStart}
      onMouseLeave={handleRevealEnd}
      onFocus={handleRevealStart}
      onBlur={handleRevealEnd}
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
          'flex min-w-0 flex-1 overflow-hidden whitespace-nowrap font-mono text-xs',
          // The fade only paints over text that reaches the container's right edge, so short rows
          // are unaffected; dropped while panning so the revealed tail stays readable.
          !isRevealed && '[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]'
        )}
      >
        <span
          className="flex min-w-0 transition-transform ease-linear motion-reduce:transition-none"
          style={{
            transform:
              isRevealed && panDistance > 0 ? `translateX(-${panDistance}px)` : 'translateX(0)',
            // Pausing before panning lets a quick mouse pass leave the row untouched; the pan
            // back starts immediately and faster, so the row settles as soon as it's left.
            transitionDuration: isRevealed ? `${panDurationMs(panDistance)}ms` : '200ms',
            transitionDelay: isRevealed ? '400ms' : '0ms',
          }}
        >
          {prefix !== '' && (
            <span className="overflow-hidden text-ellipsis text-foreground-lighter">{prefix}</span>
          )}
          <span className="shrink-0 text-foreground">{distinguishing}</span>
        </span>
      </span>
      <span className="shrink-0 pl-2">
        {isCopied ? (
          <Check size={14} className="text-brand" />
        ) : (
          <Copy
            size={14}
            className="text-foreground-lighter opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          />
        )}
      </span>
    </button>
  )
}
