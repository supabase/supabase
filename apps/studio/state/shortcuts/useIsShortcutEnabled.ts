import type { ShortcutId } from './registry'
import { useShortcutStateSnapshot } from './state'

/**
 * Reactive check for whether a shortcut is currently enabled for the user.
 *
 * Subscribes the calling component to `shortcutState` so it re-renders when
 * the user toggles this shortcut in Account → Preferences. Use this in place
 * of reading `useShortcutStateSnapshot().disabled[id]` inline at a call site
 * so the `!disabled` inversion lives in one place.
 *
 * For one-off, non-reactive checks outside render (event handlers, module-level
 * code), use the plain `isShortcutEnabled(id)` function from `./state` instead.
 *
 * @example
 * const isEnabled = useIsShortcutEnabled(SHORTCUT_IDS.AI_ASSISTANT_TOGGLE)
 * return <Tooltip>{isEnabled && <KeyboardShortcut keys={['Meta', 'I']} />}</Tooltip>
 */
export function useIsShortcutEnabled(id: ShortcutId): boolean {
  const { disabled } = useShortcutStateSnapshot()
  return !disabled[id]
}
