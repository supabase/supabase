import { Fragment } from 'react'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger } from 'ui'

import type { OnboardingSurveyOption } from './OnboardingSurvey.constants'

type OnboardingSurveySelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: readonly OnboardingSurveyOption[]
  placeholder?: string
}

/**
 * Single-choice survey question. The trigger shows only the selected label;
 * the list shows each option's description as secondary text, and puts
 * opt-out answers (Prefer not to say) below a divider.
 */
export function OnboardingSurveySelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
}: OnboardingSurveySelectProps) {
  const selectedOption = options.find((option) => option.value === value)

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
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
              <SelectItem value={option.value} className={option.description ? 'py-2' : undefined}>
                {option.description ? (
                  <div className="flex flex-col gap-y-0.5">
                    <span className="text-foreground">{option.label}</span>
                    <span className="text-xs text-foreground-lighter">{option.description}</span>
                  </div>
                ) : (
                  option.label
                )}
              </SelectItem>
            </Fragment>
          )
        })}
      </SelectContent>
    </Select>
  )
}
