import { Button, cn } from 'ui'

import type { CapabilityLevelFilter } from './TokenCapabilities.utils'

interface CapabilityLevelToggleProps {
  value: CapabilityLevelFilter
  onChange: (value: CapabilityLevelFilter) => void
}

const OPTIONS: { value: CapabilityLevelFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'read', label: 'Read' },
  { value: 'readwrite', label: 'Read-write' },
]

/**
 * Segmented control matching the "Show all / Error only" pattern from Auth's UserLogs: adjacent
 * Buttons with their variant swapped on selection, glued together via rounding/border removal
 * and a thin divider, rather than a dedicated segmented-control primitive.
 */
export const CapabilityLevelToggle = ({ value, onChange }: CapabilityLevelToggleProps) => (
  <div className="flex items-center">
    {OPTIONS.map(({ value: optionValue, label }, index) => (
      <div key={optionValue} className="flex items-center">
        {index > 0 && <div className="border-button border border-l-0 py-3" />}
        <Button
          type="button"
          size="tiny"
          variant={value === optionValue ? 'secondary' : 'default'}
          aria-pressed={value === optionValue}
          className={cn(
            index === 0 && 'rounded-r-none border-r-0',
            index === OPTIONS.length - 1 && 'rounded-l-none border-l-0',
            index > 0 && index < OPTIONS.length - 1 && 'rounded-none border-x-0'
          )}
          onClick={() => onChange(optionValue)}
        >
          {label}
        </Button>
      </div>
    ))}
  </div>
)
