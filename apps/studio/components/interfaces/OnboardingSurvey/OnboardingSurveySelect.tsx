import { Fragment, type ComponentProps } from 'react'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger } from 'ui'

import type { OnboardingSurveyOption } from './OnboardingSurvey.constants'

type OnboardingSurveySelectProps = Omit<
  ComponentProps<typeof SelectTrigger>,
  'value' | 'children' | 'className'
> & {
  value: string
  onValueChange: (value: string) => void
  options: readonly OnboardingSurveyOption[]
  placeholder?: string
}

/**
 * Single-choice survey question. The trigger shows only the selected label;
 * the list puts opt-out answers (Prefer not to say) below a divider.
 * Other props go to the trigger: FormControl passes the id that ties it to its label.
 */
export function OnboardingSurveySelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  ...triggerProps
}: OnboardingSurveySelectProps) {
  const selectedOption = options.find((option) => option.value === value)

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger {...triggerProps} className="w-full">
        {selectedOption ? (
          <span className="truncate text-foreground">{selectedOption.label}</span>
        ) : (
          <span className="text-foreground-lighter">{placeholder}</span>
        )}
      </SelectTrigger>
      <SelectContent>
        {options.map((option, index) => {
          const isFirstOptOut = option.isOptOut && !options[index - 1]?.isOptOut

          return (
            <Fragment key={option.value}>
              {isFirstOptOut && index > 0 && <SelectSeparator />}
              <SelectItem value={option.value}>{option.label}</SelectItem>
            </Fragment>
          )
        })}
      </SelectContent>
    </Select>
  )
}
