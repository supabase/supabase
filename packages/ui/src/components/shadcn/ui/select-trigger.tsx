'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronDown } from 'lucide-react'
import * as React from 'react'

import { SIZE_VARIANTS, SIZE_VARIANTS_DEFAULT } from '../../../lib/constants'
import { cn } from '../../../lib/utils/cn'
import { getExplicitTabIndex } from '../../../lib/utils/getExplicitTabIndex'

export const selectTriggerVariants = cva(
  'flex w-full cursor-pointer items-center justify-between rounded-md border border-strong hover:border-control-hover bg-control-raised text-xs data-[placeholder]:text-foreground-lighter ring-border-control focus-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 data-[state=open]:border-control-hover gap-2 [&>span]:truncate text-left',
  {
    variants: {
      size: {
        ...SIZE_VARIANTS,
      },
    },
    defaultVariants: {
      size: SIZE_VARIANTS_DEFAULT,
    },
  }
)

export type SelectTriggerVariantProps = VariantProps<typeof selectTriggerVariants>

const ComboboxTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & SelectTriggerVariantProps
>(({ className, children, disabled, size, tabIndex, ...props }, ref) => {
  const computedTabIndex = getExplicitTabIndex(tabIndex, disabled)

  return (
    <button
      ref={ref}
      type="button"
      role="combobox"
      disabled={disabled}
      className={cn(selectTriggerVariants({ size }), className)}
      tabIndex={computedTabIndex}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate text-left">{children}</span>
      <ChevronDown
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-foreground-lighter"
        strokeWidth={1.5}
      />
    </button>
  )
})
ComboboxTrigger.displayName = 'ComboboxTrigger'

export { ComboboxTrigger }
