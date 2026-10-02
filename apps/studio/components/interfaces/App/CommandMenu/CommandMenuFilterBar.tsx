'use client'

import { useEffect } from 'react'
import { cn } from 'ui'
import { useCommands, useQuery } from 'ui-patterns/CommandMenu'
import type { ICommand, ICommandSection } from 'ui-patterns/CommandMenu/internal/types'

import { setActiveSectionId, useActiveSectionId } from './CommandMenuFilterBar.state'

// Approximates cmdk's own per-item visibility check (see CommandMenuList),
// so chip counts roughly track what's actually visible below. Not an exact
// match: cmdk uses fuzzy scoring, this is plain substring matching.
function isCommandVisible(command: ICommand, trimmedQuery: string) {
  if (!trimmedQuery) return !command.defaultHidden
  return (command.value ?? command.name).toLowerCase().includes(trimmedQuery)
}

function countVisibleCommands(section: ICommandSection, trimmedQuery: string) {
  return section.commands.filter((command) => isCommandVisible(command, trimmedQuery)).length
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      tabIndex={0}
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-2 py-0.5 text-xs whitespace-nowrap transition-colors',
        active
          ? 'bg-foreground text-background border-foreground'
          : 'bg-transparent text-foreground-light border-strong hover:bg-overlay-hover'
      )}
    >
      {label}
    </button>
  )
}

/**
 * Filter chip bar: reads every registered command section (not just DB
 * resources) and lets the user narrow the palette down to one of them. Works
 * alongside FilterableCommandMenuList, which does the actual hiding.
 */
export function CommandMenuFilterBar() {
  const commandSections = useCommands() as ICommandSection[]
  const query = useQuery()
  const activeSectionId = useActiveSectionId()

  const trimmedQuery = query.trim().toLowerCase()

  useEffect(() => {
    if (!trimmedQuery) setActiveSectionId(null)
  }, [trimmedQuery])

  if (!trimmedQuery) return null

  const sectionCounts = commandSections
    .map((section) => ({
      id: section.id,
      name: section.name,
      count: countVisibleCommands(section, trimmedQuery),
    }))
    .filter((section) => section.count > 0)

  if (sectionCounts.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-4 pt-3 pb-1 overflow-x-auto shrink-0">
      <FilterChip
        label="All"
        active={activeSectionId === null}
        onClick={() => setActiveSectionId(null)}
      />
      {sectionCounts.map((section) => (
        <FilterChip
          key={section.id}
          label={`${section.name} ${section.count}`}
          active={activeSectionId === section.id}
          onClick={() => setActiveSectionId(section.id)}
        />
      ))}
    </div>
  )
}
