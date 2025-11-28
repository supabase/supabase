import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

const badgeVariants = cva('inline-flex items-center rounded-full font-normal whitespace-nowrap', {
  variants: {
    variant: {
      default: 'bg-surface-75 text-foreground-light border border-strong',
      warning: 'bg-warning bg-opacity-10 text-warning border border-warning-500',
      success: 'bg-brand bg-opacity-10 text-brand-600 border border-brand-500',
      destructive:
        'bg-destructive bg-opacity-10 text-destructive-600 border border-destructive-500',
      brand: 'bg-brand bg-opacity-10 text-brand-600 border border-brand-500',
      secondary:
        'bg-secondary bg-opacity-10 hover:bg-secondary/80 border-transparent text-secondary-foreground',
      outline: 'bg-transparent text border border-foreground-muted',
    },
    size: {
      tiny: 'px-1.5 py-[3px] text-[10px] leading-none tracking-wide uppercase',
      small: 'px-2 py-0.5 text-xs',
      large: 'px-3 py-0.5 text-sm',
    },
    dot: {
      true: '-ml-0.5 mr-1.5 h-2 w-2',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'small',
  },
})

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({
  className,
  variant = 'default',
  size = 'small',
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
