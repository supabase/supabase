'use client'

import * as SwitchPrimitives from '@radix-ui/react-switch'
import { VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

const switchRootVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-checked:bg-brand data-checked:hover:bg-brand-600/90 data-unchecked:bg-control data-unchecked:hover:bg-border',
  {
    variants: {
      size: {
        small: 'h-[16px] w-[28px]',
        medium: 'h-[20px] w-[34px]',
        large: 'h-[24px] w-[44px]',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  }
)

const switchThumbVariants = cva(
  'pointer-events-none block rounded-full bg-foreground-lighter data-checked:bg-white shadow-lg ring-0 transition-transform',
  {
    variants: {
      size: {
        small:
          'h-[12px] w-[12px] data-checked:translate-x-[13px] data-unchecked:translate-x-px',
        medium:
          'h-[16px] w-[16px] data-checked:translate-x-[15px] data-unchecked:translate-x-px',
        large:
          'h-[18px] w-[18px] data-checked:translate-x-[22px] data-unchecked:translate-x-[3px]',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  }
)

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchRootVariants> {}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, size, ...props }, ref) => (
    <SwitchPrimitives.Root
      className={cn(switchRootVariants({ size }), className)}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb className={cn(switchThumbVariants({ size }))} />
    </SwitchPrimitives.Root>
  )
)
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
