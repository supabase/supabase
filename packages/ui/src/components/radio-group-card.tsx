'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Circle } from 'lucide-react'
import * as React from 'react'

import { cn } from '../lib/utils/cn'

const RadioGroupCard = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={ref} />
})
RadioGroupCard.displayName = RadioGroupPrimitive.Root.displayName

interface RadioGroupCardItemProps {
  image?: React.ReactNode
  label: string
  showIndicator?: boolean
}

const RadioGroupCardItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupCardItemProps & React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ image, label, showIndicator = true, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      {...props}
      className={cn(
        'flex flex-col gap-2',
        'w-48',
        'bg-overlay/50',
        'rounded-md',
        'border',
        'p-2',
        'shadow-sm',
        'hover:bg-surface-300',
        'hover:border-foreground-muted',
        'hover:z-[1] focus-visible:z-[1]',
        'data-[state=checked]:z-[1]',
        'data-[state=checked]:ring-1 data-[state=checked]:ring-border',
        'data-[state=checked]:bg-surface-300',
        'data-[state=checked]:border-foreground-muted',
        'transition-colors',
        'group',
        props.className
      )}
    >
      {props.children}
      <div className="flex gap-2 w-full">
        {showIndicator && (
          <div
            className="
                aspect-square h-4 w-4 
                rounded-full border group-data-[state=checked]:border-foreground-muted
                group-focus:border-foreground-muted
                group-hover:border-foreground-muted
                ring-offset-background 
                group-focus:outline-none 
                group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 
                group-disabled:cursor-not-allowed group-disabled:opacity-50
                flex items-center justify-center
                transition
          "
          >
            <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
              <Circle className="h-2.5 w-2.5 fill-current text-current" />
            </RadioGroupPrimitive.Indicator>
          </div>
        )}

        <label
          htmlFor={props.value}
          className={cn(
            'text-xs transition-colors text-left',
            'text-light',
            'group-hover:text-foreground group-data-[state=checked]:text-foreground',
            props.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          )}
        >
          {label}
        </label>
      </div>
    </RadioGroupPrimitive.Item>
  )
})

RadioGroupCardItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroupCard, RadioGroupCardItem }
