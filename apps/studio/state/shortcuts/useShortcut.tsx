import { useHotkeySequence } from '@tanstack/react-hotkeys'
import { Fragment, useCallback } from 'react'
import { KeyboardShortcut } from 'ui'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

import { SHORTCUT_DEFINITIONS, type ShortcutId } from './registry'
import { useShortcutStateSnapshot } from './state'
import type { ShortcutOptions } from './types'
import { COMMAND_MENU_SECTIONS } from '@/components/interfaces/App/CommandMenu/CommandMenu.utils'
import useLatest from '@/hooks/misc/useLatest'

interface UseShortcutOptions extends ShortcutOptions {
  registerInCommandMenu?: boolean
}

const hotkeyToKeys = (hotkey: string): string[] =>
  hotkey.split('+').map((part) => (part === 'Mod' ? 'Meta' : part))

export function useShortcut(id: ShortcutId, callback: () => void, options?: UseShortcutOptions) {
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
    [
      {
        id,
        name: def.label,
        action: stableAction,
        badge: () => (
          <div className="flex items-center gap-1">
            {def.sequence.map((step, i) => (
              <Fragment key={i}>
                {i > 0 && <span className="text-foreground-lighter text-[11px]">then</span>}
                <KeyboardShortcut keys={hotkeyToKeys(step)} />
              </Fragment>
            ))}
          </div>
        ),
      },
    ],
    {
      enabled: enabledInCommandMenu,
      deps: depsInCommandMenu,
    }
  )
}
