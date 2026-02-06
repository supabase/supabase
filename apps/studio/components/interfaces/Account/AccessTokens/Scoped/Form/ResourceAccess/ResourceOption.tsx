import { cn } from 'ui'
import { Box } from 'lucide-react'
import { Check } from 'lucide-react'

export const ResourceOption = ({
  value,
  label,
  isSelected,
  onChange,
}: {
  value: string
  label: string
  isSelected: boolean
  onChange: () => void
}) => (
  <label
    className={cn(
      'border border-default rounded-md bg-surface-200 hover:bg-overlay-hover hover:border-control px-4 py-3 cursor-pointer transition-colors flex-1 flex flex-col',
      isSelected && 'border-foreground-muted hover:border-foreground-muted bg-surface-300'
    )}
  >
    <div className="flex justify-between items-start mb-3">
      <Box size={16} className="text-foreground-light" />
      {isSelected && (
        <div className="flex items-center justify-center p-0.5 bg-foreground text-background rounded-full">
          <Check size={12} strokeWidth="4" className="text-background" />
        </div>
      )}
    </div>
    <span className={cn('text-sm', isSelected ? 'text-foreground' : 'text-foreground-light')}>
      {label}
    </span>
    <input
      type="radio"
      name="resourceAccess"
      value={value}
      checked={isSelected}
      onChange={onChange}
      className="sr-only"
    />
  </label>
)
