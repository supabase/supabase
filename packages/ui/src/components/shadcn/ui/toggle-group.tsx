'use client'

import { cva, VariantProps } from 'class-variance-authority'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '../../../lib/utils'
import { toggleVariants } from './toggle'
import { useTabIndicator } from './useTabIndicator'

const segmentIndicatorOptions = {
  activeItemSelector: '[data-state="on"]',
  indicatorSelector: '[data-segment-indicator]',
  readyFlag: 'segmentIndicatorReady',
  leftProperty: '--active-segment-left',
  widthProperty: '--active-segment-width',
  insetByPadding: false,
}

const toggleGroupVariants = cva('flex items-center justify-center', {
  variants: {
    variant: {
      default: 'gap-1',
      outline: 'gap-1',
      segmented:
        'relative isolate w-fit gap-0 p-px border border-strong rounded-md group/segmented',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
  size: 'default',
  variant: 'default',
})

type ToggleGroupProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    /**
     * Whether clicking the active item in a `type="single"` group clears the selection.
     *
     * Defaults to `true`, matching Radix. Set to `false` for segmented controls, which
     * have no "nothing selected" state.
     */
    allowDeselect?: boolean
  }

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ className, variant, size, children, allowDeselect = true, onValueChange, ...props }, ref) => {
  const rootRef = React.useRef<HTMLDivElement>(null)
  useTabIndicator(rootRef, segmentIndicatorOptions)

  const handleValueChange = (value: string | string[]) => {
    if (!allowDeselect && value === '') return
    ;(onValueChange as ((value: string | string[]) => void) | undefined)?.(value)
  }

  return (
    <ToggleGroupPrimitive.Root
      ref={(node) => {
        rootRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      className={cn(toggleGroupVariants({ variant }), className)}
      {...props}
      onValueChange={handleValueChange}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
})

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupIndicator = ({ className, ...props }: React.ComponentPropsWithRef<'span'>) => (
  <span
    aria-hidden
    data-segment-indicator
    className={cn(
      'pointer-events-none absolute z-0 left-0 inset-y-px rounded-sm',
      'border border-strong bg-overlay-hover shadow-sm',
      'w-[var(--active-segment-width,0)] translate-x-[var(--active-segment-left,0)]',
      'transition-none opacity-0',
      'group-data-[segment-indicator-ready]/segmented:opacity-100',
      'group-data-[segment-indicator-ready]/segmented:transition-[translate,width]',
      'group-data-[segment-indicator-ready]/segmented:duration-[250ms]',
      'group-data-[segment-indicator-ready]/segmented:ease-move',
      'motion-reduce:transition-none',
      className
    )}
    {...props}
  />
)

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export {
  ToggleGroup,
  ToggleGroupIndicator,
  ToggleGroupItem,
  toggleGroupVariants,
  type ToggleGroupProps,
}
