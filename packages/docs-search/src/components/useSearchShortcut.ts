'use client'

import { useEffect } from 'react'

/**
 * Calls `onTrigger` on Cmd+K, ahead of any other handler. It runs in the capture phase and
 * stops propagation, so another search dialog listening for the same shortcut doesn't open
 * too, and `preventDefault` stops the browser's own Cmd+K command.
 */
export function useSearchShortcut(onTrigger: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'k' && event.metaKey) {
        event.stopImmediatePropagation()
        event.preventDefault()
        onTrigger()
      }
    }

    window.addEventListener('keydown', onKeyDown, { capture: true })

    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
    }
  }, [onTrigger])
}
