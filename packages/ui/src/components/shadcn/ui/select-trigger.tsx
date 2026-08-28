'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronDown, ChevronsUpDown } from 'lucide-react'
import { isValidElement, type ReactNode } from 'react'
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

export function isChevronsUpDownIcon(icon: ReactNode): boolean {
  if (!isValidElement(icon)) return false
  return icon.type === ChevronsUpDown
}

export function shouldUseComboboxTrigger({
  asChild,
  role,
  variant,
  iconRight,
}: {
  asChild?: boolean
  role?: string
  variant?: string
  iconRight?: ReactNode
}): boolean {
  if (asChild) return false
  if (variant !== 'default') return false
  if (role === 'combobox') return true
  return isChevronsUpDownIcon(iconRight)
}

const ComboboxTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    SelectTriggerVariantProps & {
      icon?: React.ReactNode
      leadingIcon?: React.ReactNode
    }
>(({ className, children, disabled, icon, leadingIcon, size, tabIndex, ...props }, ref) => {
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
      {leadingIcon ? <span className="shrink-0 text-foreground-lighter">{leadingIcon}</span> : null}
      <span className="min-w-0 flex-1 truncate text-left">{children}</span>
      {icon ?? (
        <ChevronDown className="h-4 w-4 text-foreground-lighter shrink-0" strokeWidth={1.5} />
      )}
    </button>
  )
})
ComboboxTrigger.displayName = 'ComboboxTrigger'

export { ComboboxTrigger }
