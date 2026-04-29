import { useHotkeySequence } from '@tanstack/react-hotkeys'
import { Fragment, useCallback } from 'react'
import { KeyboardShortcut } from 'ui'
import { useRegisterCommands, useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import type { ICommand } from 'ui-patterns/CommandMenu/api/types'

import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS, type ShortcutId } from './registry'
import type { ShortcutOptions } from './types'
import { useIsShortcutEnabled } from './useIsShortcutEnabled'
import { COMMAND_MENU_SECTIONS } from '@/components/interfaces/App/CommandMenu/CommandMenu.utils'
import useLatest from '@/hooks/misc/useLatest'

const hotkeyToKeys = (hotkey: string): string[] =>
  hotkey.split('+').map((part) => (part === 'Mod' ? 'Meta' : part))

const orderShortcutCommands = (commands: ICommand[], commandsToInsert: ICommand[]): ICommand[] => {
  const mergedCommands = [...commands, ...commandsToInsert]

  return mergedCommands.sort((a, b) => {
    if (a.id === SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE) return 1
    if (b.id === SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE) return -1
    return 0
  })
}

/**
 * Subscribe to a registered keyboard shortcut.
 *
 * Looks up the shortcut's `sequence` and `label` from `SHORTCUT_DEFINITIONS`,
 * wires up a global hotkey listener via `@tanstack/react-hotkeys`, and
 * (optionally) registers the shortcut as an entry in the Cmd+P command menu
 * under the "Shortcuts" section for as long as the hook is mounted.
 *
 * Option resolution priority (highest first):
 *   1. `options` passed to this hook
 *   2. `def.options` from the registry entry
 *   3. Hard-coded fallbacks (`enabled: true`, `timeout: undefined`, `registerInCommandMenu: false`)
 *
 * `enabled` is ANDed with the user's global enable/disable preference — if the
 * user has disabled the shortcut in Preferences, it won't fire even if the
 * caller or registry say `enabled: true`.
 *
 * @param id       The registered shortcut to bind to. See `SHORTCUT_IDS`.
 * @param callback Runs when the sequence matches. Always calls the latest
 *                 reference — no stale closure issues.
 * @param options  Per-mount overrides. See `ShortcutOptions`.
 *
 * @example
 * useShortcut(SHORTCUT_IDS.RESULTS_COPY_MARKDOWN, handleCopy)
 *
 * @example
 * // Surface in Cmd+P while this component is mounted:
 * useShortcut(SHORTCUT_IDS.SQL_EDITOR_RUN, runQuery, {
 *   registerInCommandMenu: true,
 * })
 *
 * @example
 * // Gate on local state — disables hotkey AND hides Cmd+P entry when false:
 * useShortcut(SHORTCUT_IDS.SAVE, handleSave, {
 *   enabled: hasUnsavedChanges,
 *   registerInCommandMenu: true,
 * })
 */
export function useShortcut(id: ShortcutId, callback: () => void, options?: ShortcutOptions) {
  const def = SHORTCUT_DEFINITIONS[id]

  // Handle override for the shortcut
  const globallyEnabled = useIsShortcutEnabled(id)
  const callerEnabled = options?.enabled ?? def.options?.enabled ?? true
  const enabled = globallyEnabled && callerEnabled
  const timeout = options?.timeout ?? def.options?.timeout ?? undefined
  const ignoreInputs = options?.ignoreInputs ?? def.options?.ignoreInputs

  // Only include `ignoreInputs` when set. The library resolves it to a concrete
  // boolean at register time (false for Meta/Ctrl/Escape, true otherwise), but
  // its setOptions does an object spread on every re-render — passing
  // `ignoreInputs: undefined` would overwrite the resolved value and re-enable
  // the input-focus guard for shortcuts that should always fire.
  useHotkeySequence(def.sequence, callback, {
    enabled,
    timeout,
    ...(ignoreInputs !== undefined && { ignoreInputs }),
  })

  // Handle overrides for command menu
  const enabledInCommandMenu = enabled && (options?.registerInCommandMenu ?? false)
  const depsInCommandMenu = [enabled, def.label]
  const callbackRef = useLatest(callback)
  const setCommandMenuOpen = useSetCommandMenuOpen()
  const stableAction = useCallback(() => {
    setCommandMenuOpen(false)
    callbackRef.current()
  }, [callbackRef, setCommandMenuOpen])

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
      orderCommands: orderShortcutCommands,
      sectionMeta: { priority: 1 },
    }
  )
}
