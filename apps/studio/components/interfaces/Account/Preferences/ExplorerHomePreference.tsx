import { RadioGroupCard, RadioGroupCardItem } from 'ui'

import { ExplorerHomePreview } from './ExplorerHomePreview'
import { explorerHomeSchema, type ExplorerHome } from './useExplorerPreferences'

interface ExplorerHomePreferenceProps {
  value: ExplorerHome
  onValueChange: (value: ExplorerHome) => void
  disabled?: boolean
}

export const ExplorerHomePreference = ({
  value,
  onValueChange,
  disabled,
}: ExplorerHomePreferenceProps) => (
  <RadioGroupCard
    aria-label="Choose how Explorer opens"
    value={value}
    onValueChange={(value) => {
      const result = explorerHomeSchema.safeParse(value)
      if (result.success) onValueChange(result.data)
    }}
    disabled={disabled}
    className="grid-cols-1 gap-3 sm:grid-cols-2"
  >
    <RadioGroupCardItem
      value="home"
      className="w-full p-4"
      label={
        <span className="flex flex-col gap-1">
          <span className="text-sm text-foreground">Start page</span>
          <span className="text-sm leading-relaxed text-foreground-light">
            Choose a query, chat, or notebook to get started.
          </span>
        </span>
      }
    >
      <ExplorerHomePreview home="home" />
    </RadioGroupCardItem>
    <RadioGroupCardItem
      value="query"
      className="w-full p-4"
      label={
        <span className="flex flex-col gap-1">
          <span className="text-sm text-foreground">SQL query</span>
          <span className="text-sm leading-relaxed text-foreground-light">
            Open a new query tab, ready to write SQL.
          </span>
        </span>
      }
    >
      <ExplorerHomePreview home="query" />
    </RadioGroupCardItem>
  </RadioGroupCard>
)
