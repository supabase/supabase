import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

const badgeVariants = cva(
  ' text-center uppercase tracking-widest px-[5.5px] py-[3px] font-medium bg-opacity-10 indent-[0.04em] ',
  {
    variants: {
      type: {
        default: 'text-[9.5px] rounded-full inline-flex items-center',
        code: 'text-[10px] font-mono rounded-md inline-flex justify-center items-center',
      },
      variant: {
        default: 'bg-surface-200 text-foreground-light border border-strong',
        warning: 'bg-warning text-warning border border-warning-500',
        success: 'bg-brand text-brand-600 border border-brand-500',
        brand: 'bg-brand text-brand-600 border border-brand-500',
        destructive: 'bg-destructive text-destructive-600 border border-destructive-500',
        secondary:
          'bg-secondary hover:bg-secondary/80 border-transparent text-secondary-foreground',
        outline: 'bg-transparent text border border-foreground-muted',
      },
      size: {
        small: '',
        large: '',
      },
      dot: {
        true: '-ml-0.5 mr-1.5 h-2 w-2',
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
  type = 'default',
  variant = 'default',
  size,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size, type }), 'leading-none', className)}
      {...props}
    >
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
