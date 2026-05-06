import { CircleX } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import {
  Button,
  KeyboardShortcut,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import {
  useActiveShortcuts,
  type ActiveShortcutDefinition,
} from '@/state/shortcuts/activeShortcuts'
import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'
import {
  SHORTCUT_REFERENCE_GROUP_LABELS,
  SHORTCUT_REFERENCE_GROUP_ORDER,
  SHORTCUT_REFERENCE_GROUPS,
} from '@/state/shortcuts/referenceGroups'

interface ShortcutsReferenceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ShortcutGroup {
  group: string
  label: string
  definitions: ActiveShortcutDefinition[]
}

const GROUP_LABELS: Record<string, string> = {
  ...SHORTCUT_REFERENCE_GROUP_LABELS,
  'action-bar': 'Actions',
  'ai-assistant': 'AI Assistant',
  'command-menu': 'Command Menu',
  'data-table': 'Data Tables',
  'inline-editor': 'Inline Editor',
  'list-page': 'List pages',
  nav: 'Navigation',
  'operation-queue': 'Operation Queue',
  results: 'Results',
  'schema-visualizer': 'Schema Visualizer',
  shortcuts: 'Shortcuts',
  'table-editor': 'Table Editor',
  'unified-logs': 'Logs',
}

const getGroupOrder = (group: string) => {
  const index = SHORTCUT_REFERENCE_GROUP_ORDER.indexOf(group)
  return index === -1 ? SHORTCUT_REFERENCE_GROUP_ORDER.length : index
}

const getGroupLabel = (group: string) => GROUP_LABELS[group] ?? group

const isScopedNavigationGroup = (group: string) =>
  group.startsWith('navigation.') && group !== SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL

const normalizeSearchValue = (value: string) => value.trim().toLowerCase()

const groupDefinitions = (activeShortcuts: ActiveShortcutDefinition[]): ShortcutGroup[] => {
  const uniqueShortcuts = Array.from(
    activeShortcuts
      .reduce<Map<string, ActiveShortcutDefinition>>((acc, definition) => {
        acc.set(definition.id, definition)
        return acc
      }, new Map())
      .values()
  )

  const grouped = uniqueShortcuts.reduce<Record<string, ActiveShortcutDefinition[]>>(
    (acc, definition) => {
      const prefix = definition.referenceGroup ?? definition.id.split('.')[0]
      acc[prefix] = acc[prefix] ?? []
      acc[prefix].push(definition)
      return acc
    },
    {}
  )

  const hasScopedNavigationGroup = Object.keys(grouped).some(isScopedNavigationGroup)

  return Object.entries(grouped)
    .map(([group, definitions]) => {
      const label =
        group === SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL && !hasScopedNavigationGroup
          ? 'Navigation'
          : getGroupLabel(group)

      return {
        group,
        label,
        definitions,
      }
    })
    .sort((a, b) => getGroupOrder(a.group) - getGroupOrder(b.group))
}

const filterGroups = (groups: ShortcutGroup[], search: string) => {
  const normalizedSearch = normalizeSearchValue(search)

  if (normalizedSearch.length === 0) return groups

  return groups.reduce<ShortcutGroup[]>((acc, group) => {
    if (normalizeSearchValue(group.label).includes(normalizedSearch)) {
      acc.push(group)
      return acc
    }

    const definitions = group.definitions.filter((definition) =>
      normalizeSearchValue(definition.label).includes(normalizedSearch)
    )

    if (definitions.length > 0) {
      acc.push({ ...group, definitions })
    }

    return acc
  }, [])
}

const ShortcutSequence = ({ sequence }: Pick<ActiveShortcutDefinition, 'sequence'>) => (
  <div className="flex items-center gap-1">
    {sequence.map((step, index) => (
      <Fragment key={`${step}-${index}`}>
        {index > 0 && <span className="text-foreground-lighter text-[11px]">then</span>}
        <KeyboardShortcut keys={hotkeyToKeys(step)} variant="pill" />
      </Fragment>
    ))}
  </div>
)

export function ShortcutsReferenceSheet({ open, onOpenChange }: ShortcutsReferenceSheetProps) {
  const [search, setSearch] = useState('')
  const activeShortcuts = useActiveShortcuts()
  const groups = filterGroups(groupDefinitions(activeShortcuts), search)

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[520px]">
        <SheetHeader className="shrink-0 py-3">
          <SheetTitle>Keyboard shortcuts</SheetTitle>
          <SheetDescription className="sr-only">
            Browse and search available keyboard shortcuts.
          </SheetDescription>
        </SheetHeader>
        <div className="shrink-0 bg-studio px-5 pt-4 pb-4">
          <Input
            aria-label="Search shortcuts"
            autoFocus={open}
            className="w-full"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search shortcuts..."
            value={search}
            actions={
              search ? (
                <Button
                  aria-label="Clear search"
                  size="tiny"
                  type="text"
                  icon={<CircleX size={14} />}
                  onClick={() => setSearch('')}
                  className="h-5 w-5 p-0"
                />
              ) : null
            }
          />
        </div>
        <SheetSection className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-4">
          {groups.length === 0 ? (
            <p className="text-sm text-foreground-muted">No matching shortcuts found</p>
          ) : (
            groups.map(({ group, label, definitions }) => (
              <section key={group} className="flex flex-col gap-2">
                <h3 className="text-xs text-foreground-lighter uppercase tracking-wider">
                  {label}
                </h3>
                <ul className="flex flex-col">
                  {definitions.map((definition) => (
                    <li
                      key={definition.id}
                      className="flex min-h-10 items-center justify-between gap-4 border-b border-muted py-2 last:border-b-0"
                    >
                      <span className="text-sm text-foreground">{definition.label}</span>
                      <ShortcutSequence sequence={definition.sequence} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </SheetSection>
      </SheetContent>
    </Sheet>
  )
}
