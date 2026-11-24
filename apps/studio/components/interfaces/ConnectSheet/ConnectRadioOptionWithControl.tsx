import { cn, Switch } from 'ui'

import type { FieldOption, ResolvedField } from './Connect.types'
import { ConnectRadioOption } from './ConnectRadioOption'

interface ConnectRadioOptionWithControlProps {
  fieldId: string
  option: FieldOption
  isFirst: boolean
  isLast: boolean
  inlineField: ResolvedField
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

/**
 * The selected radio-list option, with a switch that only affects that option (e.g. IPv4 for the
 * transaction pooler). The switch renders in a strip attached to the bottom of the option, so it
 * reads as a sub-setting of it. Render this only while the option is selected.
 *
 * The strip is a sibling of the radio, not a child, because the radio is a button and interactive
 * elements can't be nested.
 */
export function ConnectRadioOptionWithControl({
  fieldId,
  option,
  isFirst,
  isLast,
  inlineField,
  checked,
  onCheckedChange,
}: ConnectRadioOptionWithControlProps) {
  const strip = (
    <div
      className={cn(
        // Left padding lines the text up with the option's text: the radio's 21px padding,
        // 16px indicator and 12px gap. Right padding matches the radio's 21px.
        'flex items-center justify-between gap-4 py-3 pl-[49px] pr-[21px]',
        'border border-t-0 bg-surface-75',
        // The strip only exists while its option is selected, so it takes the selected border
        'border-control-hover',
        isLast && 'rounded-b-lg'
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <label htmlFor={inlineField.id} className="cursor-pointer text-xs text-foreground-light">
          {inlineField.label}
        </label>
        {inlineField.description && (
          <p className="text-xs text-foreground-lighter text-balance">{inlineField.description}</p>
        )}
      </div>
      <Switch id={inlineField.id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )

  return (
    <div className="relative">
      <ConnectRadioOption
        fieldId={fieldId}
        option={option}
        className={cn(
          // Wrapping the radio in a div makes it first/last-of-type, so the base component rounds
          // every corner. Square the bottom (it touches the strip) and any corner touching a neighbor.
          !isFirst && 'first-of-type:rounded-t-none',
          'last-of-type:rounded-b-none',
          // Soften the divider above the strip so the two read as one selection, not two stacked.
          // Repeated for hover and focus because the base component recolors every border edge there.
          'data-[state=checked]:border-b-muted',
          'enabled:hover:data-[state=checked]:border-b-muted',
          'enabled:focus-visible:data-[state=checked]:border-b-muted'
        )}
      />

      {strip}
    </div>
  )
}
