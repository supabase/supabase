import { cn, RadioGroupStackedItem, Switch } from 'ui'

import type { FieldOption, ResolvedField } from './Connect.types'
import { ConnectionIcon } from './ConnectionIcon'

interface ConnectRadioOptionProps {
  fieldId: string
  option: FieldOption
  isFirst: boolean
  isLast: boolean
  /** A switch that only affects this option, shown in a strip attached to its bottom */
  inlineControl?: {
    field: ResolvedField
    checked: boolean
    onCheckedChange: (checked: boolean) => void
  }
}

/**
 * An option in a connect radio list. When `inlineControl` is set, its switch (e.g. IPv4 for the
 * transaction pooler) renders in a strip attached to the bottom of the option, so it reads as a
 * sub-setting of it.
 *
 * Every option renders the same tree, a wrapper holding the radio and an optional strip, so the
 * radio keeps its DOM element, and keyboard focus, when the strip appears or disappears. The strip
 * is a sibling of the radio, not a child, because the radio is a button and interactive elements
 * can't be nested.
 */
export function ConnectRadioOption({
  fieldId,
  option,
  isFirst,
  isLast,
  inlineControl,
}: ConnectRadioOptionProps) {
  const hasStrip = inlineControl !== undefined

  return (
    <div className="relative">
      <RadioGroupStackedItem
        id={`connect-${fieldId}-${option.value}`}
        value={option.value}
        className={cn(
          'min-w-0 w-full text-left',
          // Selection changes apply instantly instead of fading between options
          'transition-none [&_*]:transition-none',
          // The wrapper makes every radio first/last-of-type, so the base component rounds every
          // corner. Square the corners that touch a neighbor or the strip.
          !isFirst && 'first-of-type:rounded-t-none',
          (!isLast || hasStrip) && 'last-of-type:rounded-b-none',
          // Soften the divider above the strip so the two read as one selection, not two stacked.
          // Repeated for hover and focus because the base component recolors every border edge there.
          hasStrip && 'data-[state=checked]:border-b-muted',
          hasStrip && 'enabled:hover:data-[state=checked]:border-b-muted',
          hasStrip && 'enabled:focus-visible:data-[state=checked]:border-b-muted'
        )}
        label={
          <span className="flex min-w-0 items-center gap-2">
            {option.icon && <ConnectionIcon icon={option.icon} />}
            <span className="truncate">{option.label}</span>
          </span>
        }
        description={option.description}
      />

      {inlineControl && (
        <div
          className={cn(
            // Left padding lines the text up with the option's text: the radio's 21px padding,
            // 16px indicator and 12px gap. Right padding matches the radio's 21px.
            'flex items-center justify-between gap-4 py-3 pl-12.25 pr-5.25',
            'border border-t-0 bg-surface-75',
            // The strip only exists while its option is selected, so it takes the selected border
            'border-control-hover',
            isLast && 'rounded-b-lg'
          )}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <label
              htmlFor={inlineControl.field.id}
              className="cursor-pointer text-xs text-foreground-light"
            >
              {inlineControl.field.label}
            </label>
            {inlineControl.field.description && (
              <p className="text-xs text-foreground-lighter text-balance">
                {inlineControl.field.description}
              </p>
            )}
          </div>
          <Switch
            id={inlineControl.field.id}
            checked={inlineControl.checked}
            onCheckedChange={inlineControl.onCheckedChange}
          />
        </div>
      )}
    </div>
  )
}
