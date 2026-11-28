import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'

export type AccessLevel = 'No access' | 'Read only' | 'Write' | 'Read and write'

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
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        const level = levels.find((level) => level === next)
        if (level) onChange(level)
      }}
    >
      <SelectTrigger className="w-full sm:w-40" aria-label={permission}>
        {disabled ? 'Unavailable' : <SelectValue />}
      </SelectTrigger>
      <SelectContent align="end">
        {levels.map((level) => (
          <SelectItem key={level} value={level}>
            {level}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
