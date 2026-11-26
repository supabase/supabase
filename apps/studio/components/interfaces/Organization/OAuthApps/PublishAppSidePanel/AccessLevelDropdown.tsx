import { ChevronDownIcon } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'

export type AccessLevel = 'No access' | 'Read only' | 'Write only' | 'Read and write'

export function AccessLevelDropdown({
  permission,
  levels,
  value,
  disabled,
  onChange,
}: {
  permission: string
  levels: readonly AccessLevel[]
  value: AccessLevel
  disabled?: boolean
  onChange: (level: AccessLevel) => void
}) {
  const label = disabled ? 'Unavailable' : value

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          disabled={disabled}
          iconRight={<ChevronDownIcon />}
          aria-label={`${permission}: ${label}`}
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36 w-max">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            const level = levels.find((level) => level === next)
            if (level) onChange(level)
          }}
        >
          {levels.map((level) => (
            <DropdownMenuRadioItem key={level} value={level}>
              {level}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
