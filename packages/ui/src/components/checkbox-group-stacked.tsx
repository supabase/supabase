'use client'

import * as React from 'react'

import { Checkbox } from '../components/shadcn/ui/checkbox'
import { Label } from '../components/shadcn/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/shadcn/ui/tooltip'
import { cn } from '../lib/utils/cn'

const CheckboxGroupStacked = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-col -space-y-px w-full', className)} {...props} />
    )
  }
)

CheckboxGroupStacked.displayName = 'CheckboxGroupStacked'

interface CheckboxGroupStackedItemProps {
  image?: React.ReactNode
  label: React.ReactNode
  showIndicator?: boolean
  description?: React.ReactNode
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  tooltip?: React.ReactNode
  id: string
}

const CheckboxGroupStackedItem = React.forwardRef<
  HTMLDivElement,
  CheckboxGroupStackedItemProps & Omit<React.ComponentProps<'div'>, 'id' | 'onChange'>
>(
  (
    {
      image,
      label,
      showIndicator = true,
      description,
      checked,
      onCheckedChange,
      disabled,
      tooltip,
      id,
      className,
      ...props
    },
    ref
  ) => {
    const checkboxControl = (
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-0.5"
      />
    )

    const checkboxIndicator =
      showIndicator &&
      (tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="mt-0.5 shrink-0">{checkboxControl}</span>
          </TooltipTrigger>
          <TooltipContent side="left">{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        checkboxControl
      ))

    return (
      <div
        ref={ref}
        data-state={checked ? 'checked' : 'unchecked'}
        className={cn(
          'group flex flex-col gap-2 w-full',
          'bg-overlay/50 border shadow-xs',
          'first-of-type:rounded-t-lg last-of-type:rounded-b-lg',
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:bg-surface-300 hover:border-foreground-muted',
          'hover:z-1 focus-visible:z-1 data-[state=checked]:z-1',
          'data-[state=checked]:ring-1 data-[state=checked]:ring-border',
          'data-[state=checked]:bg-surface-300 data-[state=checked]:border-foreground-muted',
          'transition',
          className
        )}
        {...props}
      >
        <div className="flex gap-3 w-full px-[21px] py-3">
          {checkboxIndicator}
          <div className="flex min-w-0 flex-col items-start gap-0.25">
            {image}
            <Label
              htmlFor={id}
              className={cn(
                'block text-left transition-colors',
                !disabled &&
                  'cursor-pointer group-hover:text-foreground group-data-[state=checked]:text-foreground'
              )}
            >
              <span className="mt-[-0.15rem] block text-sm text-light">{label}</span>
              {description ? (
                <span className="text-balance block text-sm text-foreground-lighter">
                  {description}
                </span>
              ) : null}
            </Label>
          </div>
        </div>
      </div>
    )
  }
)

CheckboxGroupStackedItem.displayName = 'CheckboxGroupStackedItem'

export { CheckboxGroupStacked, CheckboxGroupStackedItem }
