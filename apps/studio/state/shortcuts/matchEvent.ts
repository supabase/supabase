import { getSequenceManager, matchesKeyboardEvent } from '@tanstack/react-hotkeys'

import { SHORTCUT_DEFINITIONS } from './registry'
import type { RegistryDefinations } from './types'

/**
 * Returns true if the given keyboard event matches a shortcut that is both:
 *
 * 1. **In the target registry** (defaults to every known shortcut, but callers
 *    can pass a subset like `tableEditorRegistry` to scope the check)
 * 2. **Currently active and enabled** — i.e. a `useShortcut` is mounted for it
 *    AND its `enabled` option is not `false`
 *
 * Chord sequences (e.g. `['G', 'T']`) match on any individual step, so
 * pressing `G` counts as a match while the chord is in flight.
 *
 * Respecting the live `enabled` state matters: if a shortcut is registered but
 * gated off (e.g. `enabled: !!snap.selectedCellPosition`), we must NOT suppress
 * the default behavior on its behalf, because the shortcut won't actually fire.
 */

export function eventMatchesAnyShortcut(
  event: KeyboardEvent,
  registry: RegistryDefinations<string> = SHORTCUT_DEFINITIONS
): boolean {
  const scopedSteps = new Set(Object.values(registry).flatMap((def) => def.sequence))
  const activeRegistrations = getSequenceManager().registrations.state.values()

  for (const view of activeRegistrations) {
    if (view.options.enabled === false) continue
    const matches = view.sequence.some(
      (step) => scopedSteps.has(step) && matchesKeyboardEvent(event, step)
    )
    if (matches) return true
  }

  return false
}
