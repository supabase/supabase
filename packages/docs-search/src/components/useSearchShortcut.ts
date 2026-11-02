'use client'

import { useEffect } from 'react'

/**
 * Calls `onTrigger` on Cmd+K or Ctrl+K (or another `key`), ahead of any other handler. It runs in
 * the capture phase and stops propagation, so another search dialog listening for the same shortcut
 * doesn't open too, and `preventDefault` stops the browser's own Cmd+K command.
 */
export function useSearchShortcut(onTrigger: () => void, key = 'k') {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const usesPrimaryModifier = event.metaKey || event.ctrlKey
      const otherModifiersActive = event.altKey || event.shiftKey

      if (event.key?.toLowerCase() === key && usesPrimaryModifier && !otherModifiersActive) {
        event.stopImmediatePropagation()
        event.preventDefault()
        if (!event.repeat) onTrigger()
      }
    }

    window.addEventListener('keydown', onKeyDown, { capture: true })

    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
    }
  }, [onTrigger, key])
}
