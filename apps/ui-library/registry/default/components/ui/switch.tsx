'use client'

import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
  {
    variants: {
      size: {
        default: 'h-6 w-11',
        sm: 'h-5 w-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

const switchThumbVariants = cva(
  'pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
  {
    variants: {
      size: {
        default: 'h-5 w-5 data-[state=checked]:translate-x-5',
        sm: 'h-4 w-4 data-[state=checked]:translate-x-3',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, size, ...props }, ref) => (
    <SwitchPrimitives.Root className={cn(switchVariants({ size }), className)} {...props} ref={ref}>
      <SwitchPrimitives.Thumb className={cn(switchThumbVariants({ size }))} />
    </SwitchPrimitives.Root>
  )
)
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
