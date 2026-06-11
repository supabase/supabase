'use client'

import { ConfigRailOutcomeActions, ConfigRailStickyFooter } from './ConfigRailOutcomeActions'

interface ConfigRailOutcomeFooterProps {
  plan: string
  hasComposition: boolean
  onOpenManual: () => void
}

export function ConfigRailOutcomeFooter({
  plan,
  hasComposition,
  onOpenManual,
}: ConfigRailOutcomeFooterProps) {
  return (
    <ConfigRailStickyFooter>
      <ConfigRailOutcomeActions
        plan={plan}
        hasComposition={hasComposition}
        onOpenManual={onOpenManual}
      />
    </ConfigRailStickyFooter>
  )
}
