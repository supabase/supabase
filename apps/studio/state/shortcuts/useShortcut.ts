import { useHotkeySequence } from '@tanstack/react-hotkeys'

import { SHORTCUT_DEFINITIONS, type ShortcutId } from './registry'
import { useShortcutStateSnapshot } from './state'
import type { ShortcutOptions } from './types'

export function useShortcut(id: ShortcutId, callback: () => void, options?: ShortcutOptions) {
  const snap = useShortcutStateSnapshot()
  const def = SHORTCUT_DEFINITIONS[id]

  const globallyEnabled = !snap.disabled[id]
  const callerEnabled = options?.enabled ?? def.options?.enabled ?? true
  const enabled = globallyEnabled && callerEnabled

  const timeout = options?.timeout ?? def.options?.timeout ?? undefined

  useHotkeySequence(def.sequence, callback, { enabled, timeout })
}
