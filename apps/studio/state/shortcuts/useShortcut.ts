import { useHotkeySequence } from '@tanstack/react-hotkeys'
import { useCallback } from 'react'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

import { SHORTCUT_DEFINITIONS, type ShortcutId } from './registry'
import { useShortcutStateSnapshot } from './state'
import type { ShortcutOptions } from './types'
import { COMMAND_MENU_SECTIONS } from '@/components/interfaces/App/CommandMenu/CommandMenu.utils'
import useLatest from '@/hooks/misc/useLatest'

export function useShortcut(id: ShortcutId, callback: () => void, options?: ShortcutOptions) {
  const snap = useShortcutStateSnapshot()
  const def = SHORTCUT_DEFINITIONS[id]

  // Handle override for the shortcut
  const globallyEnabled = !snap.disabled[id]
  const callerEnabled = options?.enabled ?? def.options?.enabled ?? true
  const enabled = globallyEnabled && callerEnabled
  const timeout = options?.timeout ?? def.options?.timeout ?? undefined

  useHotkeySequence(def.sequence, callback, { enabled, timeout })

  // Handle overrides for command menu
  const enabledInCommandMenu = enabled && (options?.registerInCommandMenu ?? false)
  const depsInCommandMenu = [enabled, def.label]
  const callbackRef = useLatest(callback)
  const stableAction = useCallback(() => callbackRef.current(), [callbackRef])

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.SHORTCUTS,
    [{ id, name: def.label, action: stableAction }],
    {
      enabled: enabledInCommandMenu,
      deps: depsInCommandMenu,
    }
  )
}
