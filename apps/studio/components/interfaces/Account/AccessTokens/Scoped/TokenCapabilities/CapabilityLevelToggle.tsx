import { ToggleGroup, ToggleGroupItem } from 'ui'

import { PERMISSION_MODE_LABEL } from '../../AccessToken.permissions'
import type { CapabilityLevelFilter } from './TokenCapabilities.utils'

interface CapabilityLevelToggleProps {
  value: CapabilityLevelFilter
  onChange: (value: CapabilityLevelFilter) => void
}

const OPTIONS: { value: CapabilityLevelFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'read', label: PERMISSION_MODE_LABEL.read },
  { value: 'readwrite', label: PERMISSION_MODE_LABEL.readwrite },
]

export const CapabilityLevelToggle = ({ value, onChange }: CapabilityLevelToggleProps) => (
  <ToggleGroup
    type="single"
    variant="segmented"
    size="tiny"
    tone="outline"
    value={value}
    onValueChange={(newValue) => {
      if (newValue) onChange(newValue as CapabilityLevelFilter)
    }}
    allowDeselect={false}
    aria-label="Filter capabilities by permission level"
  >
    {OPTIONS.map(({ value: optionValue, label }) => (
      <ToggleGroupItem key={optionValue} value={optionValue}>
        {label}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
)
