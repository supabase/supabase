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
