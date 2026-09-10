import { useState } from 'react'
import { Accordion } from 'ui'

import type { EntryAccess } from '../../AccessToken.roles'
import type { CapabilitySummaryEntry } from '../../hooks/useCapabilitySummary'
import { CapabilityCard } from './CapabilityCard'
import { groupCapabilitiesByLevel, type CapabilityLevelFilter } from './TokenCapabilities.utils'

interface DenseCapabilitiesProps {
  capabilities: CapabilitySummaryEntry[]
  accessEntries: Record<string, EntryAccess>
  /** Which level group(s) to show — the All/Read/Read-write control lives next to the section title. */
  levelFilter: CapabilityLevelFilter
}

/** 9+ capabilities: a level-grouped list, read-write pinned first. */
export const DenseCapabilities = ({
  capabilities,
  accessEntries,
  levelFilter,
}: DenseCapabilitiesProps) => {
  const [openKeys, setOpenKeys] = useState<string[]>([])

  const { readwrite, read } = groupCapabilitiesByLevel(capabilities)

  const shown =
    levelFilter === 'readwrite'
      ? readwrite
      : levelFilter === 'read'
        ? read
        : [...readwrite, ...read]

  return (
    <div className="flex flex-col gap-4">
      {shown.length === 0 && (
        <p className="text-xs text-foreground-lighter">No capabilities match this filter.</p>
      )}

      <Accordion type="multiple" value={openKeys} onValueChange={setOpenKeys}>
        {shown.map((capability, index) => (
          <CapabilityCard
            key={capability.entry.key}
            capability={capability}
            accessEntries={accessEntries}
            isFirst={index === 0}
            isLast={index === shown.length - 1}
          />
        ))}
      </Accordion>
    </div>
  )
}
