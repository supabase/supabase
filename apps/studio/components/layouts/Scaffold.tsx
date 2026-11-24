import { forwardRef, HTMLAttributes } from 'react'
import { cn } from 'ui'

/**
 * Horizontal divider between page sections
 */
export const ScaffoldDivider = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} {...props} className={cn('w-full h-px bg-border shrink-0', className)} />
  }
)

ScaffoldDivider.displayName = 'ScaffoldDivider'
