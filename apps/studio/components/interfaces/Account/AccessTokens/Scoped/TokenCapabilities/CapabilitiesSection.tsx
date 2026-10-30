import { Accordion } from 'ui'

import type { EntryAccess } from '../../AccessToken.roles'
import type { CapabilitySummaryEntry } from '../../hooks/useCapabilitySummary'
import { CapabilityCard } from './CapabilityCard'
import { DenseCapabilities } from './DenseCapabilities'
import { getCapabilityDensityTier, type CapabilityLevelFilter } from './TokenCapabilities.utils'

interface CapabilitiesSectionProps {
  capabilities: CapabilitySummaryEntry[]
  accessEntries: Record<string, EntryAccess>
  /** Dense tier's All/Read/Read-write control, rendered by the caller next to the section title. */
  levelFilter: CapabilityLevelFilter
}

/**
 * Switches capability presentation on granted count: a moderate number render as a single
 * closed-by-default accordion, and a large grant switches to the dense, filterable view.
 */
export const CapabilitiesSection = ({
  capabilities,
  accessEntries,
  levelFilter,
}: CapabilitiesSectionProps) => {
  if (capabilities.length === 0) {
    return <span className="text-sm text-foreground-lighter">No capabilities selected</span>
  }

  const tier = getCapabilityDensityTier(capabilities.length)

  if (tier === 'accordion') {
    return (
      <Accordion type="multiple">
        {capabilities.map((capability, index) => (
          <CapabilityCard
            key={capability.entry.key}
            capability={capability}
            accessEntries={accessEntries}
            isFirst={index === 0}
            isLast={index === capabilities.length - 1}
          />
        ))}
      </Accordion>
    )
  }

  return (
    <DenseCapabilities
      capabilities={capabilities}
      accessEntries={accessEntries}
      levelFilter={levelFilter}
    />
  )
}
