import { RadioGroupStacked, RadioGroupStackedItem } from 'ui'

import type { ExpirationMode } from '@/components/interfaces/Storage/StorageVersioning.constants'

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
        description="Keep everything within the age limit, plus the newest versions up to the count."
      />
      <RadioGroupStackedItem
        value="or"
        label="Either condition is met"
        description="Keep only the newest versions up to the count, and none past the age limit."
      />
    </RadioGroupStacked>
  </div>
)
