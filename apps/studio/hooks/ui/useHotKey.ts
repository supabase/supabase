import { useEffect } from 'react'
import { useLatest } from 'react-use'

/**
 * @deprecated Use `useShortcut` from `state/shortcuts/useShortcut` instead.
 * It reads from a central shortcut registry (`SHORTCUT_DEFINITIONS`) and
 * integrates with the user's enable/disable preferences + the Cmd+P command menu.
 *
 * Migration:
 *   1. Add an entry to `state/shortcuts/registry.ts` with a unique ID, label, and sequence.
 *   2. Replace `useHotKey(cb, 'k', { shift: true })` with
 *      `useShortcut(SHORTCUT_IDS.YOUR_ID, cb)`.
 */
function useHotKey(
  callback: (e: KeyboardEvent) => void,
  key: string,
  options?: { enabled?: boolean; shift?: boolean }
): void
/**
 * @deprecated Use `useShortcut` from `state/shortcuts/useShortcut` instead.
 * The `dependencies` parameter is also deprecated in this legacy hook.
 */
function useHotKey(
  callback: (e: KeyboardEvent) => void,
  key: string,
  dependencies: unknown[],
  options?: { enabled?: boolean; shift?: boolean }
): void
function useHotKey(
  callback: (e: KeyboardEvent) => void,
  key: string,
  dependenciesOrOptions?: unknown[] | { enabled?: boolean; shift?: boolean },
  options?: { enabled?: boolean; shift?: boolean }
): void {
  // Determine which overload was called
  const isDepsArray = Array.isArray(dependenciesOrOptions)
  const resolvedOptions = isDepsArray ? options : dependenciesOrOptions
  const enabled = resolvedOptions?.enabled ?? true
  const shift = resolvedOptions?.shift ?? false

  const enabledRef = useLatest(enabled)
  const callbackRef = useLatest(callback)
  const keyRef = useLatest(key)
  const shiftRef = useLatest(shift)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!enabledRef.current) return
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === keyRef.current.toLowerCase() &&
        !e.altKey &&
        (shiftRef.current ? e.shiftKey : !e.shiftKey)
      ) {
        callbackRef.current(e)
      }
    }

    window.addEventListener('keydown', handler, true)
    return () => {
      window.removeEventListener('keydown', handler, true)
    }
  }, [callbackRef, enabledRef, keyRef, shiftRef])
}

export { useHotKey }
