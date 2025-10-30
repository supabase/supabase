import { useEffect } from 'react'

export function useHotKey(
  callback: (e: KeyboardEvent) => void,
  key: string,
  dependencies: any[] = [],
  options?: { enabled?: boolean }
): void {
  const enabled = options?.enabled ?? true

  useEffect(() => {
    if (!enabled) return

    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === key && !e.altKey && !e.shiftKey) {
        callback(e)
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [key, enabled, ...dependencies])
}
