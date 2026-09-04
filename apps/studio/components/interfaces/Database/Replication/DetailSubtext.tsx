import type { ReactNode } from 'react'
import { cn } from 'ui'

/**
 * The muted line that sits under a primary value: a destination's dataset, a region's AWS code, a
 * pipeline's id and type. One place so the treatment stays identical across the list and the
 * pipeline page.
 */
export const DetailSubtext = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => <p className={cn('text-xs text-foreground-lighter text-balance', className)}>{children}</p>

/**
 * Marks text whose full meaning lives in a tooltip, so it doesn't look like inert copy. Use on the
 * trigger itself. Values that carry their explanation in an InfoTooltip don't need it, because the
 * icon is already the affordance.
 */
export const TOOLTIP_UNDERLINE_CLASS_NAME =
  'underline decoration-dotted decoration-foreground-muted/50 hover:decoration-foreground-muted transition-colors underline-offset-4'
