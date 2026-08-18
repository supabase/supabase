import { RadioGroupStacked, RadioGroupStackedItem } from 'ui'

import type { ExpirationMode } from './StorageVersioning.constants'

interface ExpirationModeToggleProps {
  mode: ExpirationMode
  onModeChange: (mode: ExpirationMode) => void
}

/**
 * How the two lifecycle conditions combine. Laid out vertically so the two-line
 * option descriptions get the full section width.
 */
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
        // Radix emits '' when the active item is re-selected; never allow no mode.
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
