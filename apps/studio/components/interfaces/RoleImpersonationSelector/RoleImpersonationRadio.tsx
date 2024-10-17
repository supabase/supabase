import { Check, Minus } from 'lucide-react'
import { cn } from 'ui'

export interface RoleImpersonationRadioProps<T extends string> {
  label?: string
  value: T
  isSelected: boolean | 'partially'
  onSelectedChange: (value: T) => void
  icon?: React.ReactNode
}

function RoleImpersonationRadio<T extends string>({
  label,
  value,
  isSelected,
  onSelectedChange,
  icon,
}: RoleImpersonationRadioProps<T>) {
  return (
    <label
      className={cn(
        'border border-default rounded-md bg-surface-200 hover:bg-overlay-hover hover:border-control px-4 py-3 w-44 cursor-pointer transition-colors',
        isSelected && 'border-foreground-muted hover:border-foreground-muted bg-surface-300'
      )}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelectedChange(value)
        }
      }}
      htmlFor={`role-${value}`}
    >
      <div className="flex justify-between items-center mb-2">
        {icon && <div>{icon}</div>}

        {isSelected && (
          <div className="flex items-center justify-center p-0.5 bg-foreground text-background rounded-full">
            {typeof isSelected === 'boolean' && (
              <Check size={12} strokeWidth="4" className="text-background" />
            )}
            {isSelected === 'partially' && (
              <Minus size={12} strokeWidth="4" className="text-background" />
            )}
          </div>
        )}
      </div>

      <input
        id={`role-${value}`}
        type="radio"
        name="role"
        value={value}
        checked={Boolean(isSelected)}
        onChange={(e) => {
          onSelectedChange(e.target.value as T)
        }}
        className="invisible h-0 w-0 border-0"
      />
      <span
        className={cn(
          'text-sm text-foreground-light whitespace-nowrap select-none transition-colors',
          isSelected && 'text-foreground'
        )}
      >
        {label ?? value} role
      </span>
    </label>
  )
}

export default RoleImpersonationRadio
