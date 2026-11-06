import { useCallback } from 'react'

/**
 * Returns a close handler for embedded vs standalone dropdown/sheet usage.
 * When embedded, uses the provided onClose callback (or no-op if not provided).
 * When standalone, returns a function that calls setOpen(false).
 */
export function useEmbeddedCloseHandler(
  embedded: boolean,
  onClose?: () => void,
  setOpen?: (open: boolean) => void
): () => void {
  return useCallback(() => {
    if (embedded) {
      onClose?.()
    } else {
      setOpen?.(false)
    }
  }, [embedded, onClose, setOpen])
}
