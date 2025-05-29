'use client'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

const headingVariants = cva('text-foreground', {
  variants: {
    variant: {
      title: 'text-2xl',
      section: 'text-xl',
      subSection: 'text-base',
      default: 'text-sm font-medium',
      compact: 'text-xs font-medium',
      meta: 'text-xs font-mono uppercase tracking-wider font-medium',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    },
    weight: {
      regular: 'font-normal',
      medium: 'font-medium',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const linkVariants = cva(
  'text-foreground-light underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors hover:text-foreground'
)

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  asChild?: boolean
  asLink?: boolean
  is?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  (
    { className, variant, size, weight, asChild = false, asLink = false, is = 'h2', ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : is

    const combinedClassName = cn(
      headingVariants({ variant, size, weight }),
      asLink && linkVariants(),
      className
    )

    return <Comp className={combinedClassName} ref={ref} {...props} />
  }
)
Heading.displayName = 'Heading'

export { Heading, headingVariants, linkVariants }
