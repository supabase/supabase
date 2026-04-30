import { Fragment } from 'react'
import { KeyboardShortcut, Sheet, SheetContent, SheetHeader, SheetSection, SheetTitle } from 'ui'

import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'
import { SHORTCUT_DEFINITIONS } from '@/state/shortcuts/registry'
import type { ShortcutDefinition } from '@/state/shortcuts/types'

interface ShortcutsReferenceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GROUP_LABELS: Record<string, string> = {
  'action-bar': 'Actions',
  'ai-assistant': 'AI Assistant',
  'command-menu': 'Command Menu',
  'data-table': 'Data Tables',
  'inline-editor': 'Inline Editor',
  nav: 'Navigation',
  'operation-queue': 'Operation Queue',
  results: 'Results',
  shortcuts: 'Shortcuts',
  'table-editor': 'Table Editor',
  'unified-logs': 'Logs',
}

const GROUP_ORDER = [
  'command-menu',
  'shortcuts',
  'nav',
  'ai-assistant',
  'inline-editor',
  'results',
  'data-table',
  'table-editor',
  'action-bar',
  'operation-queue',
  'unified-logs',
]

const getGroupOrder = (group: string) => {
  const index = GROUP_ORDER.indexOf(group)
  return index === -1 ? GROUP_ORDER.length : index
}

const groupDefinitions = (): Array<{ group: string; definitions: ShortcutDefinition[] }> => {
  const grouped = Object.values(SHORTCUT_DEFINITIONS).reduce<Record<string, ShortcutDefinition[]>>(
    (acc, definition) => {
      const prefix = definition.id.split('.')[0]
      acc[prefix] = acc[prefix] ?? []
      acc[prefix].push(definition)
      return acc
    },
    {}
  )

  return Object.entries(grouped)
    .map(([group, definitions]) => ({
      group,
      definitions,
    }))
    .sort((a, b) => getGroupOrder(a.group) - getGroupOrder(b.group))
}

const ShortcutSequence = ({ sequence }: Pick<ShortcutDefinition, 'sequence'>) => (
  <div className="flex items-center gap-1">
    {sequence.map((step, index) => (
      <Fragment key={`${step}-${index}`}>
        {index > 0 && <span className="text-foreground-lighter text-[11px]">then</span>}
        <KeyboardShortcut keys={hotkeyToKeys(step)} />
      </Fragment>
    ))}
  </div>
)

export function ShortcutsReferenceSheet({ open, onOpenChange }: ShortcutsReferenceSheetProps) {
  const groups = groupDefinitions()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-[520px]">
        <SheetHeader className="shrink-0 py-3">
          <SheetTitle>Keyboard shortcuts</SheetTitle>
        </SheetHeader>
        <SheetSection className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-4">
          {groups.map(({ group, definitions }) => (
            <section key={group} className="flex flex-col gap-2">
              <h3 className="text-xs text-foreground-lighter uppercase tracking-wider">
                {GROUP_LABELS[group] ?? group}
              </h3>
              <ul className="flex flex-col">
                {definitions.map((definition) => (
                  <li
                    key={definition.id}
                    className="flex min-h-10 items-center justify-between gap-4 border-b py-2 last:border-b-0"
                  >
                    <span className="text-sm text-foreground">{definition.label}</span>
                    <ShortcutSequence sequence={definition.sequence} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </SheetSection>
      </SheetContent>
    </Sheet>
  )
}
