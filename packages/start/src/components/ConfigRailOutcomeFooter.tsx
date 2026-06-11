'use client'

import { ConfigRailOutcomeActions, ConfigRailStickyFooter } from './ConfigRailOutcomeActions'

interface ConfigRailOutcomeFooterProps {
  plan: string
  hasComposition: boolean
  onOpenManual: () => void
  onOpenAgentPlan: () => void
}

export function ConfigRailOutcomeFooter({
  plan,
  hasComposition,
  onOpenManual,
  onOpenAgentPlan,
}: ConfigRailOutcomeFooterProps) {
  return (
    <ConfigRailStickyFooter>
      <ConfigRailOutcomeActions
        plan={plan}
        hasComposition={hasComposition}
        onOpenManual={onOpenManual}
        onOpenAgentPlan={onOpenAgentPlan}
      />
    </ConfigRailStickyFooter>
  )
}
