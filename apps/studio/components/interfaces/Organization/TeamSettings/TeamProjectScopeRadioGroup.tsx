import { Badge, RadioGroupStacked, RadioGroupStackedItem } from 'ui'

type TeamProjectScopeRadioGroupProps = {
  value: 'all-projects' | 'specific-projects'
  onValueChange: (value: 'all-projects' | 'specific-projects') => void
  hasProjectScopeEntitlement: boolean
  disabled?: boolean
}

export function TeamProjectScopeRadioGroup({
  value,
  onValueChange,
  hasProjectScopeEntitlement,
  disabled = false,
}: TeamProjectScopeRadioGroupProps) {
  return (
    <RadioGroupStacked
      disabled={disabled}
      value={value}
      onValueChange={(next) => {
        if (next === 'specific-projects' && !hasProjectScopeEntitlement) return
        onValueChange(next as 'all-projects' | 'specific-projects')
      }}
    >
      <RadioGroupStackedItem
        value="all-projects"
        label="All projects"
        description="Apply this role across the entire organization, including future projects"
      />
      <RadioGroupStackedItem
        value="specific-projects"
        disabled={!hasProjectScopeEntitlement}
        label={
          <span className="flex w-full items-center justify-between gap-3">
            <span>Specific projects</span>
            {!hasProjectScopeEntitlement ? <Badge>Team</Badge> : null}
          </span>
        }
        description="Choose which projects this member can access"
      />
    </RadioGroupStacked>
  )
}
