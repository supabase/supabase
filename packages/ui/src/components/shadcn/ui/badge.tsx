import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-opacity-10',
  {
    variants: {
      variant: {
        default: 'bg-surface-200 text-foreground-light border border-strong',
        warning: 'bg-warning text-warning-600 border border-warning-500',
        success: 'bg-brand text-brand-600 border border-brand-500',
        destructive: 'bg-destructive text-destructive-600 border border-destructive-500',
        brand: 'bg-brand text-brand-600 border border-brand-500',
        secondary:
          'bg-secondary hover:bg-secondary/80 border-transparent text-secondary-foreground',
        outline: 'bg-transparent text border border-foreground-muted',
      },
      size: {
        small: 'px-2.5 py-0.5 text-xs',
        large: 'px-3 py-0.5 rounded-full text-sm',
      },
      dot: {
        true: '-ml-0.5 mr-1.5 h-2 w-2 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'small',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({
  className,
  variant = 'default',
  size,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <svg className={badgeVariants({ dot })} fill="currentColor" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="3" />
        </svg>
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
