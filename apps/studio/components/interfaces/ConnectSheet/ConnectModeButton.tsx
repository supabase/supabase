import { cva, type VariantProps } from 'class-variance-authority'
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

/** Maps mode count → container-query breakpoint used when collapsing to a single row. */
type ModeCountBreakpoint = 3 | 4 | 5 | 6

function toModeCountBreakpoint(count: number): ModeCountBreakpoint {
  if (count === 3 || count === 4 || count === 5) return count
  return 6
}

const connectModeButtonVariants = cva(
  [
    // Each cell owns a border; adjacent edges overlap (RadioGroupStacked-style)
    'relative -mb-px -mr-px flex cursor-pointer flex-col items-center gap-2 border bg-overlay/50 p-4 shadow-xs transition-colors',
    'focus-visible:z-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
  ],
  {
    variants: {
      selected: {
        true: 'z-1 border-foreground-muted bg-surface-300 ring-1 ring-border',
        false:
          'hover:z-1 hover:border-foreground-muted hover:bg-background dark:hover:bg-surface-200',
      },
      // Narrow 2-col outer corners
      topLeft: {
        true: 'rounded-tl-lg',
        false: '',
      },
      topRight: {
        true: 'rounded-tr-lg',
        false: '',
      },
      bottomLeft: {
        true: 'rounded-bl-lg',
        false: '',
      },
      bottomRight: {
        true: 'rounded-br-lg',
        false: '',
      },
      // Wide single-row reshaping (compounded with modeCount for the breakpoint)
      singleRowStart: {
        true: '',
        false: '',
      },
      singleRowEnd: {
        true: '',
        false: '',
      },
      clearTopRight: {
        true: '',
        false: '',
      },
      clearBottomLeft: {
        true: '',
        false: '',
      },
      clearBottomRight: {
        true: '',
        false: '',
      },
      modeCount: {
        3: '',
        4: '',
        5: '',
        6: '',
      },
    },
    compoundVariants: [
      // Full class strings so Tailwind can see them (no dynamic fragment concatenation)
      {
        singleRowStart: true,
        modeCount: 3,
        class: '@[28rem]:rounded-tl-lg @[28rem]:rounded-bl-lg',
      },
      {
        singleRowStart: true,
        modeCount: 4,
        class: '@[30rem]:rounded-tl-lg @[30rem]:rounded-bl-lg',
      },
      {
        singleRowStart: true,
        modeCount: 5,
        class: '@[32rem]:rounded-tl-lg @[32rem]:rounded-bl-lg',
      },
      {
        singleRowStart: true,
        modeCount: 6,
        class: '@[36rem]:rounded-tl-lg @[36rem]:rounded-bl-lg',
      },

      { singleRowEnd: true, modeCount: 3, class: '@[28rem]:rounded-tr-lg @[28rem]:rounded-br-lg' },
      { singleRowEnd: true, modeCount: 4, class: '@[30rem]:rounded-tr-lg @[30rem]:rounded-br-lg' },
      { singleRowEnd: true, modeCount: 5, class: '@[32rem]:rounded-tr-lg @[32rem]:rounded-br-lg' },
      { singleRowEnd: true, modeCount: 6, class: '@[36rem]:rounded-tr-lg @[36rem]:rounded-br-lg' },

      { clearTopRight: true, modeCount: 3, class: '@[28rem]:rounded-tr-none' },
      { clearTopRight: true, modeCount: 4, class: '@[30rem]:rounded-tr-none' },
      { clearTopRight: true, modeCount: 5, class: '@[32rem]:rounded-tr-none' },
      { clearTopRight: true, modeCount: 6, class: '@[36rem]:rounded-tr-none' },

      { clearBottomLeft: true, modeCount: 3, class: '@[28rem]:rounded-bl-none' },
      { clearBottomLeft: true, modeCount: 4, class: '@[30rem]:rounded-bl-none' },
      { clearBottomLeft: true, modeCount: 5, class: '@[32rem]:rounded-bl-none' },
      { clearBottomLeft: true, modeCount: 6, class: '@[36rem]:rounded-bl-none' },

      { clearBottomRight: true, modeCount: 3, class: '@[28rem]:rounded-br-none' },
      { clearBottomRight: true, modeCount: 4, class: '@[30rem]:rounded-br-none' },
      { clearBottomRight: true, modeCount: 5, class: '@[32rem]:rounded-br-none' },
      { clearBottomRight: true, modeCount: 6, class: '@[36rem]:rounded-br-none' },
    ],
    defaultVariants: {
      selected: false,
      topLeft: false,
      topRight: false,
      bottomLeft: false,
      bottomRight: false,
      singleRowStart: false,
      singleRowEnd: false,
      clearTopRight: false,
      clearBottomLeft: false,
      clearBottomRight: false,
      modeCount: 6,
    },
  }
)

const connectModeButtonIconVariants = cva('', {
  variants: {
    selected: {
      true: 'text-foreground',
      false: 'text-foreground-light',
    },
  },
  defaultVariants: {
    selected: false,
  },
})

const connectModeButtonLabelVariants = cva('heading-default text-center', {
  variants: {
    selected: {
      true: 'text-foreground',
      false: 'text-foreground-light',
    },
  },
  defaultVariants: {
    selected: false,
  },
})

const connectModeButtonDescriptionVariants = cva('text-sm leading-tight text-center', {
  variants: {
    selected: {
      true: 'text-foreground-light',
      false: 'text-foreground-lighter',
    },
  },
  defaultVariants: {
    selected: false,
  },
})

const connectModeEmptySlotVariants = cva(
  // Sunk vs mode tiles (bg-overlay/50); surface-200 reads clearly recessed on light
  'relative -mb-px -mr-px rounded-br-lg border bg-surface-200 dark:bg-surface-100',
  {
    variants: {
      modeCount: {
        3: '@[28rem]:hidden',
        4: '@[30rem]:hidden',
        5: '@[32rem]:hidden',
        6: '@[36rem]:hidden',
      },
    },
    defaultVariants: {
      modeCount: 6,
    },
  }
)

type ConnectModeButtonCornerVariants = Pick<
  VariantProps<typeof connectModeButtonVariants>,
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'singleRowStart'
  | 'singleRowEnd'
  | 'clearTopRight'
  | 'clearBottomLeft'
  | 'clearBottomRight'
  | 'modeCount'
>

export interface ConnectModeButtonProps
  extends Omit<ComponentPropsWithoutRef<'button'>, 'children'>, ConnectModeButtonCornerVariants {
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
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  singleRowStart,
  singleRowEnd,
  clearTopRight,
  clearBottomLeft,
  clearBottomRight,
  modeCount,
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
        connectModeButtonVariants({
          selected,
          topLeft,
          topRight,
          bottomLeft,
          bottomRight,
          singleRowStart,
          singleRowEnd,
          clearTopRight,
          clearBottomLeft,
          clearBottomRight,
          modeCount,
        }),
        className
      )}
      {...props}
    >
      <span className={connectModeButtonIconVariants({ selected })}>{MODE_ICONS[modeId]}</span>
      <div>
        <p className={connectModeButtonLabelVariants({ selected })}>{label}</p>
        <p className={connectModeButtonDescriptionVariants({ selected })}>{description}</p>
      </div>
    </button>
  )
}

/** Derive CVA corner variants from a cell's position in the mode grid. */
export function getConnectModeButtonCornerVariants({
  index,
  count,
  emptySlots,
}: {
  index: number
  count: number
  emptySlots: number
}): ConnectModeButtonCornerVariants {
  const isLast = index === count - 1
  const narrowLastRowStart = (Math.ceil(count / 2) - 1) * 2
  const topLeft = index === 0
  const topRight = index === 1
  const bottomLeft = index === narrowLastRowStart
  const bottomRight = emptySlots === 0 && isLast

  return {
    modeCount: toModeCountBreakpoint(count),
    topLeft,
    topRight,
    bottomLeft,
    bottomRight,
    // Once wide enough for a single row, reshape corners to left/right caps
    singleRowStart: index === 0,
    singleRowEnd: isLast,
    clearTopRight: topRight && !isLast,
    clearBottomLeft: bottomLeft && index !== 0,
    clearBottomRight: bottomRight && !isLast,
  }
}

export function getConnectModeEmptySlotClasses(count: number) {
  return connectModeEmptySlotVariants({ modeCount: toModeCountBreakpoint(count) })
}
