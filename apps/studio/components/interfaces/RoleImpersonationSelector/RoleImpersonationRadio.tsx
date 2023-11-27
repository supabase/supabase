import { IconCheck, cn } from 'ui'

export interface RoleImpersonationRadioProps {
  value: string
  isSelected: boolean
  onSelectedChange: (value: string) => void
  icon?: React.ReactNode
}

const RoleImpersonationRadio = ({
  value,
  isSelected,
  onSelectedChange,
  icon,
}: RoleImpersonationRadioProps) => {
  return (
    <label
      className={cn(
        'border border-default rounded-md bg-surface-100 px-4 py-3 w-44 cursor-pointer transition-colors',
        isSelected && 'border-stronger bg-surface-300'
      )}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelectedChange(value)
        }
      }}
    >
      <div className="flex justify-between items-center mb-2">
        {icon && <div>{icon}</div>}

        {isSelected && (
          <IconCheck
            size="tiny"
            strokeWidth="3"
            className="bg-foreground text-background rounded-full"
          />
        )}
      </div>

      <input
        type="radio"
        name="role"
        value={value}
        checked={isSelected}
        onChange={(e) => {
          onSelectedChange(e.target.value)
        }}
        className="invisible h-0 w-0 border-0"
      />
      <span
        className={cn(
          'text-sm text-foreground-light whitespace-nowrap select-none transition-colors',
          isSelected && 'text-foreground'
        )}
      >
        {value} role
      </span>
    </label>
  )
}

export default RoleImpersonationRadio
