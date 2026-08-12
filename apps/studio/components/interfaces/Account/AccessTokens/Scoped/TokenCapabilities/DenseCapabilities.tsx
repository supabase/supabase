import { useState } from 'react'
import { Accordion, Badge, Input, ToggleGroup, ToggleGroupItem } from 'ui'

import type { EntryAccess } from '../../AccessToken.roles'
import type { CapabilitySummaryEntry } from '../../hooks/useCapabilitySummary'
import { CapabilityCard } from './CapabilityCard'
import { DENSE_READONLY_PREVIEW_ROWS } from './TokenCapabilities.constants'
import {
  filterCapabilities,
  getNotGrantedCatalogEntries,
  groupCapabilitiesByLevel,
  type CapabilityLevelFilter,
} from './TokenCapabilities.utils'

interface DenseCapabilitiesProps {
  capabilities: CapabilitySummaryEntry[]
  accessEntries: Record<string, EntryAccess>
}

/**
 * 9+ capabilities: a text/path filter and read/read-write segmented control narrow a level-grouped
 * list. Read-write is pinned first and never truncated; read-only previews a few rows. A path match
 * auto-expands its parent capability on top of whatever the user has manually opened.
 */
export const DenseCapabilities = ({ capabilities, accessEntries }: DenseCapabilitiesProps) => {
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<CapabilityLevelFilter>('all')
  const [manuallyOpenKeys, setManuallyOpenKeys] = useState<string[]>([])
  const [showAllReadOnly, setShowAllReadOnly] = useState(false)

  const filtered = filterCapabilities(capabilities, query, levelFilter)
  const forcedOpenKeys = filtered
    .filter((match) => match.matchedByPath)
    .map((match) => match.capability.entry.key)
  const openKeys = Array.from(new Set([...manuallyOpenKeys, ...forcedOpenKeys]))

  const { readwrite, read } = groupCapabilitiesByLevel(filtered.map((match) => match.capability))
  const notGranted = getNotGrantedCatalogEntries(capabilities)

  const visibleRead = showAllReadOnly ? read : read.slice(0, DENSE_READONLY_PREVIEW_ROWS)
  const hiddenReadCount = read.length - visibleRead.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          size="tiny"
          placeholder="Filter by capability or endpoint..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="max-w-xs"
        />
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={levelFilter}
          onValueChange={(value) => {
            if (value) setLevelFilter(value as CapabilityLevelFilter)
          }}
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="read">Read</ToggleGroupItem>
          <ToggleGroupItem value="readwrite">Read-write</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {readwrite.length === 0 && read.length === 0 && (
        <p className="text-xs text-foreground-lighter">No capabilities match your filter.</p>
      )}

      <Accordion type="multiple" value={openKeys} onValueChange={setManuallyOpenKeys}>
        {readwrite.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
              Read-write · {readwrite.length}
            </p>
            <div className="flex flex-col gap-2 rounded-md border border-warning-400 p-2">
              {readwrite.map((capability) => (
                <CapabilityCard
                  key={capability.entry.key}
                  capability={capability}
                  collapsible
                  accessEntries={accessEntries}
                />
              ))}
            </div>
          </div>
        )}

        {read.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
              Read-only · {read.length}
            </p>
            <div className="flex flex-col gap-2">
              {visibleRead.map((capability) => (
                <CapabilityCard
                  key={capability.entry.key}
                  capability={capability}
                  collapsible
                  accessEntries={accessEntries}
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
