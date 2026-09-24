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

/**
 * Selected treatment for a segmented item that has no indicator to defer to, which is
 * only ever a `type="multiple"` group. A single indicator cannot straddle several
 * selected items, so those paint their own.
 */
const segmentedSelfPaint = 'data-[state=on]:bg-overlay-hover aria-checked:bg-overlay-hover'

/**
 * `tone` restyles a segmented group using the Button variant vocabulary. It is a second
 * axis on purpose: `variant` is shadcn's, and its `outline` value is already in use, so
 * it cannot be redefined to mean Button's.
 */
const segmentedToneVariants = cva('', {
  variants: {
    tone: {
      outline: 'border border-strong',
      text: '',
      primary: '',
    },
  },
  defaultVariants: { tone: 'text' },
})

const segmentedIndicatorToneVariants = cva('', {
  variants: {
    tone: {
      outline: 'bg-overlay-hover border border-strong shadow-sm',
      text: 'bg-accent',
      primary:
        'bg-brand-400 dark:bg-brand-500 border border-brand-500/75 dark:border-brand-default/30',
    },
  },
  defaultVariants: { tone: 'text' },
})

const toggleGroupVariants = cva('flex items-center justify-center', {
  variants: {
    variant: {
      default: 'gap-1',
      outline: 'gap-1',
      segmented: 'relative isolate w-fit gap-0 p-px rounded-md group/segmented',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & { hasIndicator?: boolean }
>({
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
    /**
     * Button-flavoured styling for a segmented group. Ignored by other variants.
     */
    tone?: VariantProps<typeof segmentedToneVariants>['tone']
  }

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(
  (
    { className, variant, size, tone, children, allowDeselect = true, onValueChange, ...props },
    ref
  ) => {
    const rootRef = React.useRef<HTMLDivElement>(null)
    useTabIndicator(rootRef, segmentIndicatorOptions)

    // The indicator is the only selected-state affordance, so a segmented group always
    // renders one rather than leaving it to the callsite to remember.
    const hasIndicator = variant === 'segmented' && props.type === 'single'

    // Swallowing the callback is enough when the caller owns `value`, but an uncontrolled
    // group's state lives inside Radix, which has already cleared it by the time the change
    // reaches us. Take ownership for that case so the active item actually stays put.
    const ownsValue = !allowDeselect && props.type === 'single' && props.value === undefined
    const [internalValue, setInternalValue] = React.useState(() =>
      typeof props.defaultValue === 'string' ? props.defaultValue : ''
    )

    const handleValueChange = (value: string & string[]) => {
      if (!allowDeselect && value === '') return
      if (ownsValue && typeof value === 'string') setInternalValue(value)
      if (onValueChange) onValueChange(value)
    }

    // Cast is contained: `ownsValue` has already narrowed `type` to 'single' at runtime,
    // which the spread cannot carry through Radix's discriminated union.
    const rootProps = (
      ownsValue ? { ...props, value: internalValue, defaultValue: undefined } : props
    ) as React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>

    return (
      <ToggleGroupPrimitive.Root
        ref={(node) => {
          rootRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        className={cn(
          toggleGroupVariants({ variant }),
          variant === 'segmented' && segmentedToneVariants({ tone }),
          className
        )}
        {...rootProps}
        onValueChange={handleValueChange}
      >
        {hasIndicator && <ToggleGroupIndicator tone={tone} />}
        <ToggleGroupContext.Provider value={{ variant, size, hasIndicator }}>
          {children}
        </ToggleGroupContext.Provider>
      </ToggleGroupPrimitive.Root>
    )
  }
)

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupIndicator = ({
  className,
  tone,
  ...props
}: React.ComponentPropsWithRef<'span'> & VariantProps<typeof segmentedIndicatorToneVariants>) => (
  <span
    aria-hidden
    data-segment-indicator
    className={cn(
      'pointer-events-none absolute z-0 left-0 inset-y-px rounded-sm',
      segmentedIndicatorToneVariants({ tone }),
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
  const resolvedVariant = context.variant || variant

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: resolvedVariant,
          size: context.size || size,
        }),
        resolvedVariant === 'segmented' && !context.hasIndicator && segmentedSelfPaint,
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
  segmentedIndicatorToneVariants,
  segmentedToneVariants,
  toggleGroupVariants,
  type ToggleGroupProps,
}
