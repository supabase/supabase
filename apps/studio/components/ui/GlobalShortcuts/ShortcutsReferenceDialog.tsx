import { Fragment } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogTitle,
  KeyboardShortcut,
} from 'ui'

import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'
import { SHORTCUT_DEFINITIONS } from '@/state/shortcuts/registry'
import type { ShortcutDefinition } from '@/state/shortcuts/types'

interface ShortcutsReferenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GROUP_LABELS: Record<string, string> = {
  nav: 'Navigate',
  results: 'Results',
  shortcuts: 'Help',
}

const groupDefinitions = (): Array<{ group: string; defs: ShortcutDefinition[] }> => {
  const grouped = Object.values(SHORTCUT_DEFINITIONS).reduce<Record<string, ShortcutDefinition[]>>(
    (acc, def) => {
      const prefix = def.id.split('.')[0]
      acc[prefix] = acc[prefix] ?? []
      acc[prefix].push(def)
      return acc
    },
    {}
  )
  return Object.entries(grouped).map(([group, defs]) => ({ group, defs }))
}

export function ShortcutsReferenceDialog({ open, onOpenChange }: ShortcutsReferenceDialogProps) {
  const groups = groupDefinitions()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Every shortcut registered in the dashboard. Press <kbd>?</kbd> anytime to reopen this.
          </DialogDescription>
        </DialogHeader>
        <DialogSection className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto">
          {groups.map(({ group, defs }) => (
            <div key={group} className="flex flex-col gap-2">
              <h3 className="text-xs uppercase tracking-wide text-foreground-lighter">
                {GROUP_LABELS[group] ?? group}
              </h3>
              <ul className="flex flex-col">
                {defs.map((def) => (
                  <li
                    key={def.id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <span className="text-sm text-foreground">{def.label}</span>
                    <div className="flex items-center gap-1">
                      {def.sequence.map((step, i) => (
                        <Fragment key={i}>
                          {i > 0 && (
                            <span className="text-foreground-lighter text-[11px]">then</span>
                          )}
                          <KeyboardShortcut keys={hotkeyToKeys(step)} />
                        </Fragment>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
