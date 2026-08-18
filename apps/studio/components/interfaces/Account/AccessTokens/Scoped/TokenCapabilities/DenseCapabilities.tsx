import { useState } from 'react'
import { Accordion, Badge } from 'ui'

import type { EntryAccess } from '../../AccessToken.roles'
import type { CapabilitySummaryEntry } from '../../hooks/useCapabilitySummary'
import { CapabilityCard } from './CapabilityCard'
import {
  getNotGrantedCatalogEntries,
  groupCapabilitiesByLevel,
  type CapabilityLevelFilter,
} from './TokenCapabilities.utils'

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
  const notGranted = getNotGrantedCatalogEntries(capabilities)

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

      {notGranted.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
            Not granted · {notGranted.length}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {notGranted.map((entry) => (
              <Badge key={entry.key} variant="default">
                {entry.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
