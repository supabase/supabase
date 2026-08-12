import { useState } from 'react'
import { Accordion, Badge } from 'ui'

import type { EntryAccess } from '../../AccessToken.roles'
import type { CapabilitySummaryEntry } from '../../hooks/useCapabilitySummary'
import { CapabilityCard } from './CapabilityCard'
import { DENSE_READONLY_PREVIEW_ROWS } from './TokenCapabilities.constants'
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

/**
 * 9+ capabilities: a level-grouped list. Read-write is pinned first and never truncated;
 * read-only previews a few rows.
 */
export const DenseCapabilities = ({
  capabilities,
  accessEntries,
  levelFilter,
}: DenseCapabilitiesProps) => {
  const [openKeys, setOpenKeys] = useState<string[]>([])
  const [showAllReadOnly, setShowAllReadOnly] = useState(false)

  const { readwrite, read } = groupCapabilitiesByLevel(capabilities)
  const notGranted = getNotGrantedCatalogEntries(capabilities)

  const showReadWrite = levelFilter !== 'read' && readwrite.length > 0
  const showRead = levelFilter !== 'readwrite' && read.length > 0

  const visibleRead = showAllReadOnly ? read : read.slice(0, DENSE_READONLY_PREVIEW_ROWS)
  const hiddenReadCount = read.length - visibleRead.length

  return (
    <div className="flex flex-col gap-4">
      {!showReadWrite && !showRead && (
        <p className="text-xs text-foreground-lighter">No capabilities match this filter.</p>
      )}

      <Accordion type="multiple" value={openKeys} onValueChange={setOpenKeys}>
        {showReadWrite && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
              Read-write · {readwrite.length}
            </p>
            <div>
              {readwrite.map((capability, index) => (
                <CapabilityCard
                  key={capability.entry.key}
                  capability={capability}
                  collapsible
                  accessEntries={accessEntries}
                  isFirst={index === 0}
                  isLast={index === readwrite.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {showRead && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
              Read-only · {read.length}
            </p>
            <div>
              {visibleRead.map((capability, index) => (
                <CapabilityCard
                  key={capability.entry.key}
                  capability={capability}
                  collapsible
                  accessEntries={accessEntries}
                  isFirst={index === 0}
                  isLast={index === visibleRead.length - 1}
                />
              ))}
            </div>
            {hiddenReadCount > 0 && (
              <button
                type="button"
                tabIndex={0}
                onClick={() => setShowAllReadOnly(true)}
                className="self-start text-xs text-foreground-light hover:text-foreground"
              >
                Show {hiddenReadCount} more
              </button>
            )}
          </div>
        )}
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
