'use client'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

const textVariants = cva('', {
  variants: {
    variant: {
      default: 'text-sm',
      subTitle: 'text-base',
      compact: 'text-xs',
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
      semibold: 'font-semibold',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const linkVariants = cva(
  'text-foreground-light underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors hover:text-foreground'
)

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  asChild?: boolean
  asLink?: boolean
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, size, weight, asChild = false, asLink = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'p'

    const combinedClassName = cn(
      textVariants({ variant, size, weight }),
      asLink && linkVariants(),
      className
    )

    return <Comp className={combinedClassName} ref={ref} {...props} />
  }
)
Text.displayName = 'Text'

export { Text, textVariants, linkVariants }
