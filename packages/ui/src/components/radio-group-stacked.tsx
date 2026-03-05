'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Circle } from 'lucide-react'
import * as React from 'react'

import { Label } from '../components/shadcn/ui/label'
import { cn } from '../lib/utils/cn'

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
        // Base layout and sizing
        'flex flex-col gap-2 w-full',
        // Base styles
        'bg-overlay/50 border shadow-sm',
        'first-of-type:rounded-t-lg last-of-type:rounded-b-lg',
        // Disabled state
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Enabled/hover states
        'enabled:cursor-pointer enabled:hover:bg-surface-300 enabled:hover:border-foreground-muted',
        // Z-index for interactions
        'hover:z-[1] focus-visible:z-[1] data-[state=checked]:z-[1]',
        // Checked state
        'data-[state=checked]:ring-1 data-[state=checked]:ring-border',
        'data-[state=checked]:bg-surface-300 data-[state=checked]:border-foreground-muted',
        // Transitions and group
        'transition group',
        props.className
      )}
    >
      <div className="flex gap-3 w-full px-[21px] py-3">
        {showIndicator && (
          <div
            className={cn(
              // Base styles
              'aspect-square h-4 w-4 min-w-4 min-h-4 rounded-full border relative',
              'flex items-center justify-center',
              'ring-offset-background transition',
              // States
              'group-data-[state=checked]:border-foreground-muted',
              'group-focus:border-foreground-muted group-focus:outline-none',
              'group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2',
              'group-hover:border-foreground-muted'
            )}
          >
            <RadioGroupPrimitive.Indicator className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Circle size={10} strokeWidth={0} className="fill-current text-current" />
            </RadioGroupPrimitive.Indicator>
          </div>
        )}
        <div className="flex flex-col gap-0.25 items-start">
          <Label
            htmlFor={props.value}
            className={cn(
              // Base styles
              'block -mt-[0.15rem] text-sm text-left text-light',
              // Transitions
              'transition-colors',
              // States
              'enabled:group-hover:text-foreground group-data-[state=checked]:text-foreground'
            )}
          >
            {label}
          </Label>
          {props.description && (
            <p className="text-left text-sm text-foreground-lighter text-balance">
              {props.description}
            </p>
          )}
          {props.children}
        </div>
      </div>
    </RadioGroupPrimitive.Item>
  )
})

RadioGroupStackedItem.displayName = 'RadioGroupStackedItem'

export { RadioGroupStacked, RadioGroupStackedItem }
