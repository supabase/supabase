'use client'

import * as PopoverPrimitive from '@radix-ui/react-popover'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

type PopoverContentProps = {
  align?: 'center' | 'start' | 'end'
  sideOffset?: number
  sameWidthAsTrigger?: boolean
} & React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, align = 'center', sideOffset = 4, sameWidthAsTrigger = false, ...props }, ref) => {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          sameWidthAsTrigger ? 'w-[var(--tw-popover-trigger-width)]' : '',
          'z-50 w-72 rounded-md border border-overlay bg-overlay p-4 text-popover-foreground shadow-md outline-none animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})
PopoverContent.displayName = 'PopoverContent'

const PopoverSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} {...props} className={cn('w-full h-px bg-border-overlay', className)} />
  )
)
PopoverSeparator.displayName = 'PopoverSeparator'

export { Popover, PopoverAnchor, PopoverContent, PopoverSeparator, PopoverTrigger }
