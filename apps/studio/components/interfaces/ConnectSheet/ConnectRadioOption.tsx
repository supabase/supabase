import { cn, RadioGroupStackedItem } from 'ui'

import type { FieldOption } from './Connect.types'
import { ConnectionIcon } from './ConnectionIcon'

interface ConnectRadioOptionProps {
  fieldId: string
  option: FieldOption
  className?: string
}

export function ConnectRadioOption({ fieldId, option, className }: ConnectRadioOptionProps) {
  return (
    <RadioGroupStackedItem
      id={`connect-${fieldId}-${option.value}`}
      value={option.value}
      className={cn(
        'min-w-0 w-full text-left',
        // Selection changes apply instantly instead of fading between options
        'transition-none [&_*]:transition-none',
        className
      )}
      label={
        <span className="flex min-w-0 items-center gap-2">
          {option.icon && <ConnectionIcon icon={option.icon} />}
          <span className="truncate">{option.label}</span>
        </span>
      }
      description={option.description}
    />
  )
}
