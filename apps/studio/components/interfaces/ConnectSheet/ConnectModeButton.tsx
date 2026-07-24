import { Box, Cable, Database, Server, Sparkles } from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from 'ui'

import type { ConnectMode } from './Connect.types'

const MODE_ICONS: Record<string, ReactNode> = {
  framework: <Box size={16} strokeWidth={1.5} />,
  direct: <Database size={16} strokeWidth={1.5} />,
  orm: <Cable size={16} strokeWidth={1.5} />,
  mcp: <Sparkles size={16} strokeWidth={1.5} />,
  server: <Server size={16} strokeWidth={1.5} />,
}

export interface ConnectModeButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'children'
> {
  modeId: ConnectMode
  label: string
  description: string
  selected?: boolean
}

export function ConnectModeButton({
  modeId,
  label,
  description,
  selected = false,
  className,
  type = 'button',
  ...props
}: ConnectModeButtonProps) {
  return (
    <button
      type={type}
      tabIndex={0}
      aria-pressed={selected}
      className={cn(
        // Each cell owns a border; adjacent edges overlap (RadioGroupStacked-style)
        'relative -mb-px -mr-px flex cursor-pointer flex-col items-center gap-2 border bg-overlay/50 p-4 shadow-xs transition-colors',
        'focus-visible:z-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        selected
          ? 'z-1 border-foreground-muted bg-surface-300 ring-1 ring-border'
          : 'hover:z-1 hover:border-foreground-muted hover:bg-background dark:hover:bg-surface-200',
        className
      )}
      {...props}
    >
      <span className={cn(selected ? 'text-foreground' : 'text-foreground-light')}>
        {MODE_ICONS[modeId]}
      </span>
      <div>
        <p
          className={cn(
            'heading-default text-center',
            selected ? 'text-foreground' : 'text-foreground-light'
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            'text-sm leading-tight text-center',
            selected ? 'text-foreground-light' : 'text-foreground-lighter'
          )}
        >
          {description}
        </p>
      </div>
    </button>
  )
}

/** Full class strings so Tailwind can see them (no dynamic fragment concatenation). */
export function getConnectModeButtonCornerClasses({
  index,
  count,
  emptySlots,
}: {
  index: number
  count: number
  emptySlots: number
}) {
  const isLast = index === count - 1
  const narrowLastRowStart = (Math.ceil(count / 2) - 1) * 2
  const isNarrowTopLeft = index === 0
  const isNarrowTopRight = index === 1
  const isNarrowBottomLeft = index === narrowLastRowStart
  const isNarrowBottomRight = emptySlots === 0 && isLast

  // Full class strings so Tailwind can see them (no dynamic fragment concatenation)
  const wideCornerClasses = {
    clearTopRight:
      count === 3
        ? '@[28rem]:rounded-tr-none'
        : count === 4
          ? '@[30rem]:rounded-tr-none'
          : count === 5
            ? '@[32rem]:rounded-tr-none'
            : '@[36rem]:rounded-tr-none',
    clearBottomLeft:
      count === 3
        ? '@[28rem]:rounded-bl-none'
        : count === 4
          ? '@[30rem]:rounded-bl-none'
          : count === 5
            ? '@[32rem]:rounded-bl-none'
            : '@[36rem]:rounded-bl-none',
    clearBottomRight:
      count === 3
        ? '@[28rem]:rounded-br-none'
        : count === 4
          ? '@[30rem]:rounded-br-none'
          : count === 5
            ? '@[32rem]:rounded-br-none'
            : '@[36rem]:rounded-br-none',
    singleRowLeft:
      count === 3
        ? '@[28rem]:rounded-tl-lg @[28rem]:rounded-bl-lg'
        : count === 4
          ? '@[30rem]:rounded-tl-lg @[30rem]:rounded-bl-lg'
          : count === 5
            ? '@[32rem]:rounded-tl-lg @[32rem]:rounded-bl-lg'
            : '@[36rem]:rounded-tl-lg @[36rem]:rounded-bl-lg',
    singleRowRight:
      count === 3
        ? '@[28rem]:rounded-tr-lg @[28rem]:rounded-br-lg'
        : count === 4
          ? '@[30rem]:rounded-tr-lg @[30rem]:rounded-br-lg'
          : count === 5
            ? '@[32rem]:rounded-tr-lg @[32rem]:rounded-br-lg'
            : '@[36rem]:rounded-tr-lg @[36rem]:rounded-br-lg',
  }

  return cn(
    isNarrowTopLeft && 'rounded-tl-lg',
    isNarrowTopRight && 'rounded-tr-lg',
    isNarrowBottomLeft && 'rounded-bl-lg',
    isNarrowBottomRight && 'rounded-br-lg',
    // Once wide enough for a single row, reshape corners to left/right caps
    index === 0 && wideCornerClasses.singleRowLeft,
    isLast && wideCornerClasses.singleRowRight,
    isNarrowTopRight && !isLast && wideCornerClasses.clearTopRight,
    isNarrowBottomLeft && index !== 0 && wideCornerClasses.clearBottomLeft,
    isNarrowBottomRight && !isLast && wideCornerClasses.clearBottomRight
  )
}

export function getConnectModeEmptySlotClasses(count: number) {
  const hideEmpty =
    count === 3
      ? '@[28rem]:hidden'
      : count === 4
        ? '@[30rem]:hidden'
        : count === 5
          ? '@[32rem]:hidden'
          : '@[36rem]:hidden'

  return cn(
    // Sunk vs mode tiles (bg-overlay/50); surface-200 reads clearly recessed on light
    'relative -mb-px -mr-px rounded-br-lg border bg-surface-200 dark:bg-surface-100',
    hideEmpty
  )
}
