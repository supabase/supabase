import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { cn } from 'ui'

export type StateDotVariant = 'success' | 'warning' | 'destructive' | 'default'

const DOT_CLASS_NAME: Record<StateDotVariant, string> = {
  success: 'bg-brand',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  default: 'bg-foreground-muted',
}

interface StateDotProps extends ComponentPropsWithoutRef<'span'> {
  variant: StateDotVariant
  children: ReactNode
  /** Pulse for states that are in motion, such as starting or restarting. */
  isPulsing?: boolean
  /** Offsets `animate-ping` so neighbouring pulsing dots don't flash in lockstep. */
  pulseDelayMs?: number
  labelClassName?: string
}

/**
 * A coloured dot with a label: the one way a state is shown across Replication. Green means
 * streaming or healthy, red means broken, amber means in motion or at risk, grey means waiting.
 *
 * Forwards its ref and spreads props so it can be the child of a Radix `asChild` trigger.
 */
export const StateDot = forwardRef<HTMLSpanElement, StateDotProps>(
  (
    { variant, children, isPulsing = false, pulseDelayMs = 0, className, labelClassName, ...props },
    ref
  ) => (
    <span ref={ref} className={cn('inline-flex items-center gap-x-2', className)} {...props}>
      <span className="relative flex h-2 w-2 shrink-0">
        {isPulsing && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              DOT_CLASS_NAME[variant]
            )}
            style={pulseDelayMs > 0 ? { animationDelay: `${pulseDelayMs}ms` } : undefined}
          />
        )}
        <span
          className={cn('relative inline-flex h-2 w-2 rounded-full', DOT_CLASS_NAME[variant])}
        />
      </span>
      <span className={labelClassName}>{children}</span>
    </span>
  )
)
StateDot.displayName = 'StateDot'
