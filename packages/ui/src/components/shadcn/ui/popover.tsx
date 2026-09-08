'use client'

import { Popover as PopoverPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'
import { getExplicitTabIndex } from '../../../lib/utils/getExplicitTabIndex'
import styles from './popover.module.css'

const Popover = PopoverPrimitive.Root

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(({ disabled, tabIndex, ...props }, ref) => {
  const computedTabIndex = getExplicitTabIndex(tabIndex, disabled)

  return (
    <PopoverPrimitive.Trigger
      ref={ref}
      {...props}
      disabled={disabled}
      tabIndex={computedTabIndex}
    />
  )
})
PopoverTrigger.displayName = PopoverPrimitive.Trigger.displayName

const PopoverAnchor = PopoverPrimitive.Anchor

export type PopoverContentProps = {
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
          sameWidthAsTrigger ? styles['popover-trigger-width'] : '',
          'z-50 w-72 rounded-md border border-overlay bg-overlay p-4 text-popover-foreground shadow-md outline-hidden animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
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
