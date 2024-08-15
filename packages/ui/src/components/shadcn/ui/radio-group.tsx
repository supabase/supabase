'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Circle } from 'lucide-react'
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
        'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
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
        'shadow-sm',
        'hover:border-stronger hover:bg-surface-300',
        'data-[state=checked]:border-primary',
        'data-[state=checked]:ring-1 data-[state=checked]:ring-border',
        'data-[state=checked]:bg-selection data-[state=checked]:border-foreground',
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
                'left-[1px] top-[1px]',
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
                'group-hover:border-foreground-light',
                'group-data-[state=checked]:border-foreground',
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
