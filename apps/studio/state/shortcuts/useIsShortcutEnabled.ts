import type { ShortcutId } from './registry'
import { useShortcutPreferences } from './state'

/**
 * Reactive check for whether a shortcut is currently enabled for the user.
 *
 * Subscribes the calling component to the shortcut preferences query so it
 * re-renders when the user toggles this shortcut in Account → Preferences.
 *
 * For one-off, non-reactive checks outside render (event handlers, module-level
 * code), use the plain `isShortcutEnabled(id)` function from `./state` instead.
 *
 * @example
 * const isEnabled = useIsShortcutEnabled(SHORTCUT_IDS.AI_ASSISTANT_TOGGLE)
 * return <Tooltip>{isEnabled && <KeyboardShortcut keys={['Meta', 'I']} />}</Tooltip>
 */
export function useIsShortcutEnabled(id: ShortcutId): boolean {
  const { disabled } = useShortcutPreferences()
  return !disabled[id]
}
