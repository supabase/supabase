'use client'

import { Circle } from 'lucide-react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={ref} />
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'relative aspect-square h-4 w-4 rounded-full border border-primary text-primary focus-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Circle size={10} strokeWidth={0} className="fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

interface RadioGroupLargeItemProps {
  image?: React.ReactNode
  label: string
  showIndicator?: boolean
}

const RadioGroupLargeItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupLargeItemProps & React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ image, label, showIndicator = true, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      {...props}
      className={cn(
        'flex flex-col gap-2',
        'w-48',
        'bg-surface-200',
        'rounded-md border border-strong',
        'p-2',
        'shadow-xs',
        'hover:border-control-hover focus-visible:border-control-hover hover:bg-surface-300',
        'data-[state=checked]:bg-selection data-[state=checked]:border-control-hover',
        'transition-colors',
        'group',
        props.className
      )}
    >
      {props.children}
      <div className="flex gap-2 w-full">
        {showIndicator && (
          <div className="relative w-3 h-3 min-w-3 mt-0.5">
            <RadioGroupPrimitive.Indicator
              className={cn(
                'absolute',
                'w-[10px] h-[10px]',
                'left-px top-px',
                'border border-background-surface-300',
                'rounded-full',
                'data-[state=checked]:border-background-surface-300',
                'data-[state=checked]:ring-foreground',
                'data-[state=checked]:bg-foreground'
              )}
            />
            <div
              className={cn(
                'absolute',
                'w-3 h-3',
                'border border-stronger',
                'rounded-full',
                'group-hover:border-control-hover',
                'group-focus-visible:border-control-hover',
                'group-data-[state=checked]:border-control-hover',
                'transition-colors'
              )}
            ></div>
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

RadioGroupLargeItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem, RadioGroupLargeItem }
