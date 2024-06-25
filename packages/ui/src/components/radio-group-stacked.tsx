'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import * as React from 'react'

import { cn } from '../lib/utils/cn'
import { Label_Shadcn_ } from '../..'
import { Circle } from 'lucide-react'

const RadioGroupStacked = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn('flex flex-col -space-y-px w-full', className)}
      {...props}
      ref={ref}
    />
  )
})

RadioGroupStacked.displayName = 'RadioGroupStacked'

interface RadioGroupStackedItemProps {
  image?: React.ReactNode
  label: string
  showIndicator?: boolean
  description?: string
}

const RadioGroupStackedItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupStackedItemProps & React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ image, label, showIndicator = true, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      {...props}
      className={cn(
        'flex flex-col gap-2',
        'w-full',
        'bg-overlay/50',
        'border',
        'first-of-type:rounded-t-lg last-of-type:rounded-b-lg',
        'shadow-sm',
        'hover:bg-surface-300',
        'hover:border-foreground-muted',
        'hover:z-[1] focus-visible:z-[1]',
        'data-[state=checked]:z-[1]',
        'data-[state=checked]:ring-1 data-[state=checked]:ring-border',
        'data-[state=checked]:bg-surface-300',
        'data-[state=checked]:border-foreground-muted',
        'transition',
        'group',
        props.className
      )}
    >
      <div className="flex gap-3 w-full px-[21px] py-3">
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
        <div className="flex flex-col gap-0.25 items-start">
          <Label_Shadcn_
            htmlFor={props.value}
            className={cn(
              'block',
              '-mt-[0.15rem]',
              'text-sm transition-colors text-left',
              'text-light',
              'group-hover:text-foreground group-data-[state=checked]:text-foreground',
              props.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
            )}
          >
            {label}
          </Label_Shadcn_>
          {props.description && (
            <p className="text-sm text-foreground-lighter">{props.description}</p>
          )}
          {props.children}
        </div>
      </div>
    </RadioGroupPrimitive.Item>
  )
})

RadioGroupStackedItem.displayName = 'RadioGroupStackedItem'

export { RadioGroupStacked, RadioGroupStackedItem }
