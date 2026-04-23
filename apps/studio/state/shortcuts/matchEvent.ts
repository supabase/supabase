import { matchesKeyboardEvent } from '@tanstack/react-hotkeys'

import { SHORTCUT_DEFINITIONS } from './registry'

/**
 * Returns true if the given keyboard event matches any registered shortcut —
 * including individual steps of chord sequences (so the first key of `['G', 'T']`
 * is considered a match when the user presses `G`).
 *
 * Useful for components that need to let registered shortcuts take priority over
 * their own keyboard behavior (e.g. stopping react-data-grid from entering edit
 * mode when the keystroke is bound to a shortcut).
 */
export function eventMatchesAnyShortcut(
  event: KeyboardEvent,
  registry = SHORTCUT_DEFINITIONS
): boolean {
  return Object.values(registry).some((def) =>
    def.sequence.some((step) => matchesKeyboardEvent(event, step))
  )
}
