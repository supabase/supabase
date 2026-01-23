import { useCallback, useEffect } from 'react'

import { detectOS } from 'lib/helpers'

export function getModKey() {
  const os = detectOS()
  return os === 'macos' ? '⌘' : 'Ctrl+'
}

interface UseOperationQueueShortcutsOptions {
  enabled: boolean
  onSave: () => void
  onTogglePanel: () => void
  isSaving?: boolean
  hasOperations?: boolean
}

/**
 * Hook that provides keyboard shortcuts for the operation queue.
 *
 * Shortcuts:
 * - Cmd/Ctrl + S: Save all pending changes
 * - Cmd/Ctrl + .: Toggle the operation queue side panel
 *
 * These shortcuts are registered on the capture phase to ensure they fire
 * before the data grid handles the keyboard event.
 */
export function useOperationQueueShortcuts({
  enabled,
  onSave,
  onTogglePanel,
  isSaving = false,
  hasOperations = true,
}: UseOperationQueueShortcutsOptions) {
  const os = detectOS()
  const modKey = os === 'macos' ? '⌘' : 'Ctrl+'

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isMod = os === 'macos' ? event.metaKey : event.ctrlKey

      if (isMod && event.key === 's') {
        event.preventDefault()
        event.stopPropagation()
        if (!isSaving && hasOperations) {
          onSave()
        }
      } else if (isMod && event.key === '.') {
        event.preventDefault()
        event.stopPropagation()
        onTogglePanel()
      }
    },
    [os, isSaving, hasOperations, onSave, onTogglePanel]
  )

  // Use capture phase to intercept events before the grid handles them
  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown, true)
      return () => {
        window.removeEventListener('keydown', handleKeyDown, true)
      }
    }
  }, [enabled, handleKeyDown])

  return { modKey }
}
