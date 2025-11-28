import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 justify-center rounded-full font-normal whitespace-nowrap tracking-[0.07em] uppercase font-medium text-[9px] leading-none px-[5.5px] py-[3px]',
  {
    variants: {
      variant: {
        default: 'bg-surface-75 text-foreground-light border border-strong',
        warning: 'bg-warning bg-opacity-10 text-warning border border-warning-500',
        success: 'bg-brand bg-opacity-10 text-brand-600 border border-brand-500',
        destructive:
          'bg-destructive bg-opacity-10 text-destructive-600 border border-destructive-500',
        // Secondary is invisible
        secondary:
          'bg-secondary bg-opacity-50 hover:bg-secondary/80 border-transparent text-secondary-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  )
}

export { Badge }
