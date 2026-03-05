import { useEffect } from 'react'
import { useLatest } from 'react-use'

// [Joshen] Refactor: Remove dependencies, and just make this into a single definition
function useHotKey(
  callback: (e: KeyboardEvent) => void,
  key: string,
  options?: { enabled?: boolean }
): void
/**
 * @deprecated The `dependencies` parameter is deprecated. Use the overload without dependencies instead.
 */
function useHotKey(
  callback: (e: KeyboardEvent) => void,
  key: string,
  dependencies: unknown[],
  options?: { enabled?: boolean }
): void
function useHotKey(
  callback: (e: KeyboardEvent) => void,
  key: string,
  dependenciesOrOptions?: unknown[] | { enabled?: boolean },
  options?: { enabled?: boolean }
): void {
  // Determine which overload was called
  const isDepsArray = Array.isArray(dependenciesOrOptions)
  const resolvedOptions = isDepsArray ? options : dependenciesOrOptions
  const enabled = resolvedOptions?.enabled ?? true

  const enabledRef = useLatest(enabled)
  const callbackRef = useLatest(callback)
  const keyRef = useLatest(key)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!enabledRef.current) return
      if ((e.metaKey || e.ctrlKey) && e.key === keyRef.current && !e.altKey && !e.shiftKey) {
        callbackRef.current(e)
      }
    }

    window.addEventListener('keydown', handler, true)
    return () => {
      window.removeEventListener('keydown', handler, true)
    }
  }, [callbackRef, enabledRef, keyRef])
}

export { useHotKey }
