'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { Slider as SliderPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

const sliderRootVariants = cva('relative flex w-full touch-none select-none items-center', {
  variants: {
    variant: {
      default: '',
      expressive: 'h-10',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

/**
 * `expressive` reads `--slider-track-image` so a call site can preview what the
 * slider actually controls — a gradient, stepped bands — on top of the
 * `bg-muted` base, without a bespoke variant per use. Set it in `style` on the
 * `Slider`; it inherits down to the track.
 */
const sliderTrackVariants = cva('relative w-full grow overflow-hidden', {
  variants: {
    variant: {
      default: 'h-1 rounded-full bg-surface-300',
      expressive: 'h-full rounded-lg bg-muted [background-image:var(--slider-track-image,none)]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const sliderRangeVariants = cva('absolute h-full', {
  variants: {
    variant: {
      default: 'bg-foreground-muted',
      expressive: 'rounded-lg bg-accent',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const sliderThumbVariants = cva(
  'block transition-colors focus-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'h-5 w-5 rounded-full border-2 border-background-surface-100 bg-foreground',
        // 2px wide is the drawn handle; `hit-area-x-2` widens the grab target to
        // 18px without changing what is painted.
        expressive: 'h-8 w-[2px] rounded-full bg-foreground hit-area-x-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

/**
 * Evenly spaced marks across the track, painted under the range so the
 * selection reads as covering them. Purely decorative — the accessible value
 * comes from the Radix thumb.
 */
const SLIDER_TICKS_CLASS =
  'pointer-events-none absolute inset-0 bg-center bg-no-repeat [background-image:repeating-linear-gradient(to_right,transparent_0,transparent_1.5rem,oklch(from_var(--foreground-muted)_l_c_h_/_0.55)_1.5rem,oklch(from_var(--foreground-muted)_l_c_h_/_0.55)_calc(1.5rem_+_1px))] [background-size:100%_0.5rem]'

export interface SliderProps
  extends
    React.ComponentProps<typeof SliderPrimitive.Root>,
    VariantProps<typeof sliderRootVariants> {}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  variant = 'default',
  ...props
}: SliderProps) {
  const _values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(sliderRootVariants({ variant }), className)}
      {...props}
    >
      <SliderPrimitive.Track data-slot="slider-track" className={sliderTrackVariants({ variant })}>
        {variant === 'expressive' && (
          <span data-slot="slider-ticks" aria-hidden className={SLIDER_TICKS_CLASS} />
        )}
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={sliderRangeVariants({ variant })}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={sliderThumbVariants({ variant })}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
