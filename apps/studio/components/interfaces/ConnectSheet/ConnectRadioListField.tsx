import { RadioGroupStacked } from 'ui'

import type { FieldOption, ResolvedField } from './Connect.types'
import { ConnectRadioOption } from './ConnectRadioOption'
import { ConnectRadioOptionWithControl } from './ConnectRadioOptionWithControl'

interface ConnectRadioListFieldProps {
  field: ResolvedField
  options: FieldOption[]
  state: Record<string, string | boolean | string[]>
  activeFields: ResolvedField[]
  onFieldChange: (fieldId: string, value: string | boolean | string[]) => void
}

/**
 * A radio list. Switch fields that declare `inlineWithOption` for this field render inside the
 * matching option instead of as their own row.
 */
export function ConnectRadioListField({
  field,
  options,
  state,
  activeFields,
  onFieldChange,
}: ConnectRadioListFieldProps) {
  const inlineFields = activeFields.filter(
    (f) => f.type === 'switch' && f.inlineWithOption?.fieldId === field.id
  )

  return (
    <RadioGroupStacked
      value={String(state[field.id] ?? '')}
      onValueChange={(v) => onFieldChange(field.id, v)}
      className="min-w-0 w-full"
    >
      {options.map((option, index) => {
        const inlineField = inlineFields.find((f) => f.inlineWithOption?.value === option.value)

        if (!inlineField) {
          return <ConnectRadioOption key={option.value} fieldId={field.id} option={option} />
        }

        return (
          <ConnectRadioOptionWithControl
            key={option.value}
            fieldId={field.id}
            option={option}
            isFirst={index === 0}
            isLast={index === options.length - 1}
            inlineField={inlineField}
            checked={Boolean(state[inlineField.id])}
            onCheckedChange={(checked) => onFieldChange(inlineField.id, checked)}
          />
        )
      })}
    </RadioGroupStacked>
  )
}
