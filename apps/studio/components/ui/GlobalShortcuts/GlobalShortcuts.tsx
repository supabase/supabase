import { useState } from 'react'
import { useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'

import { ShortcutChordHud } from './ShortcutChordHud'
import { ShortcutsReferenceSheet } from './ShortcutsReferenceSheet'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export function GlobalShortcuts() {
  const [referenceOpen, setReferenceOpen] = useState(false)
  const setCommandMenuOpen = useSetCommandMenuOpen()

  useShortcut(
    SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE,
    () => {
      setCommandMenuOpen(false)
      setReferenceOpen(true)
    },
    {
      registerInCommandMenu: true,
    }
  )

  return (
    <>
      <ShortcutChordHud />
      <ShortcutsReferenceSheet open={referenceOpen} onOpenChange={setReferenceOpen} />
    </>
  )
}
