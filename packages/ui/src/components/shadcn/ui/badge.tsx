import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 justify-center rounded-md whitespace-nowrap border font-medium text-[11px] leading-[1.0] px-1 py-[3px] transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-surface-100 text-foreground-light border-default',
        warning: 'bg-warning bg-opacity-10 text-warning border border-warning-500',
        success: 'bg-brand bg-opacity-10 text-brand-600 border border-brand-500',
        destructive:
          'bg-destructive bg-opacity-10 text-destructive-600 border border-destructive-500',
        secondary: 'bg-transparent border-transparent text-foreground-light',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

// Forward refs in order to allow tooltips to be applied to the badge
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props}>
        {children}
      </div>
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
