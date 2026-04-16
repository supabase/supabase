import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'

import { ShortcutsReferenceDialog } from './ShortcutsReferenceDialog'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

/**
 * Mounts the app-wide keyboard shortcuts that aren't tied to a specific
 * component — navigation chords (G → T/E/S/D/A) and the shortcut reference
 * dialog (press ?). Place this inside a layout that stays mounted across
 * route changes (e.g. DefaultLayout).
 */
export function GlobalShortcuts() {
  const router = useRouter()
  const { ref } = useParams()
  const [referenceOpen, setReferenceOpen] = useState(false)

  const goTo = useCallback(
    (path: string) => () => {
      if (!ref) return
      router.push(`/project/${ref}${path}`)
    },
    [ref, router]
  )

  const navEnabled = !!ref

  useShortcut(SHORTCUT_IDS.NAV_TABLE_EDITOR, goTo('/editor'), {
    enabled: navEnabled,
    registerInCommandMenu: true,
  })
  useShortcut(SHORTCUT_IDS.NAV_SQL_EDITOR, goTo('/sql'), {
    enabled: navEnabled,
    registerInCommandMenu: true,
  })
  useShortcut(SHORTCUT_IDS.NAV_STORAGE, goTo('/storage/files'), {
    enabled: navEnabled,
    registerInCommandMenu: true,
  })
  useShortcut(SHORTCUT_IDS.NAV_DATABASE, goTo('/database/tables'), {
    enabled: navEnabled,
    registerInCommandMenu: true,
  })
  useShortcut(SHORTCUT_IDS.NAV_AUTH, goTo('/auth/users'), {
    enabled: navEnabled,
    registerInCommandMenu: true,
  })

  useShortcut(SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE, () => setReferenceOpen(true), {
    registerInCommandMenu: true,
  })

  return <ShortcutsReferenceDialog open={referenceOpen} onOpenChange={setReferenceOpen} />
}
