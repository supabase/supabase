import { RadioGroupStacked, RadioGroupStackedItem } from 'ui'

import type { ExpirationMode } from './StorageVersioning.constants'

interface ExpirationModeToggleProps {
  mode: ExpirationMode
  onModeChange: (mode: ExpirationMode) => void
}

export const ExpirationModeToggle = ({ mode, onModeChange }: ExpirationModeToggleProps) => (
  <div className="mt-2 flex w-full flex-col gap-y-2">
    <label htmlFor="expiration_mode" className="text-sm text-foreground">
      Expire a noncurrent version when
    </label>
    <RadioGroupStacked
      id="expiration_mode"
      className="w-full"
      value={mode}
      onValueChange={(value: ExpirationMode) => {
        if (value) onModeChange(value)
      }}
    >
      <RadioGroupStackedItem
        value="and"
        label="Both conditions are met"
        description="It exceeds both the age limit and the retained-versions cap."
      />
      <RadioGroupStackedItem
        value="or"
        label="Either condition is met"
        description="It exceeds either the age limit or the retained-versions cap."
      />
    </RadioGroupStacked>
  </div>
)
