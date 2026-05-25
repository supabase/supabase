import { ICommand } from 'ui-patterns'

import { SHORTCUT_IDS } from './registry'

/**
 * Shared orderer for the Cmd+K "Shortcuts" section. Keeps the "Show all
 * keyboard shortcuts" entry pinned to the bottom regardless of registration
 * order; everything else is order-stable. Exported so `useDynamicShortcut`
 * can share the same ordering behavior.
 */
export const orderShortcutCommands = (
  commands: ICommand[],
  commandsToInsert: ICommand[]
): ICommand[] => {
  const mergedCommands = [...commands, ...commandsToInsert]

  return mergedCommands.sort((a, b) => {
    if (a.id === SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE) return 1
    if (b.id === SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE) return -1
    return 0
  })
}
