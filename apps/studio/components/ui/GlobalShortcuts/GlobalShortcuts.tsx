import { useState } from 'react'
import { useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'

import { ShortcutChordHud } from './ShortcutChordHud'
import { ShortcutsReferenceSheet } from './ShortcutsReferenceSheet'
import { useIsShortcutChordHudEnabled } from '@/components/interfaces/Account/Preferences/useDashboardSettings'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export function GlobalShortcuts() {
  const [referenceOpen, setReferenceOpen] = useState(false)
  const setCommandMenuOpen = useSetCommandMenuOpen()
  const isShortcutChordHudEnabled = useIsShortcutChordHudEnabled()

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
      {isShortcutChordHudEnabled && <ShortcutChordHud />}
      <ShortcutsReferenceSheet open={referenceOpen} onOpenChange={setReferenceOpen} />
    </>
  )
}
