import { Accordion } from 'ui'

import type { EntryAccess } from '../../AccessToken.roles'
import type { CapabilitySummaryEntry } from '../../hooks/useCapabilitySummary'
import { CapabilityCard } from './CapabilityCard'
import { DenseCapabilities } from './DenseCapabilities'
import { getCapabilityDensityTier } from './TokenCapabilities.utils'

interface CapabilitiesSectionProps {
  capabilities: CapabilitySummaryEntry[]
  accessEntries: Record<string, EntryAccess>
}

/**
 * Switches capability presentation on granted count: a handful render fully expanded, a moderate
 * number collapse into an accordion, and a large grant switches to the dense, filterable view.
 */
export const CapabilitiesSection = ({ capabilities, accessEntries }: CapabilitiesSectionProps) => {
  if (capabilities.length === 0) {
    return <span className="text-sm text-foreground-lighter">No capabilities selected</span>
  }

  const tier = getCapabilityDensityTier(capabilities.length)

  if (tier === 'expanded') {
    return (
      <div className="flex flex-col gap-3">
        {capabilities.map((capability) => (
          <CapabilityCard
            key={capability.entry.key}
            capability={capability}
            collapsible={false}
            accessEntries={accessEntries}
          />
        ))}
      </div>
    )
  }

  if (tier === 'accordion') {
    return (
      <Accordion type="multiple" className="flex flex-col gap-3">
        {capabilities.map((capability) => (
          <CapabilityCard
            key={capability.entry.key}
            capability={capability}
            collapsible
            accessEntries={accessEntries}
          />
        ))}
      </Accordion>
    )
  }

  return <DenseCapabilities capabilities={capabilities} accessEntries={accessEntries} />
}
