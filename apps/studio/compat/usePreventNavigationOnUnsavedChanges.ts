import { useBlocker } from '@tanstack/react-router'
import { useCallback } from 'react'

import { isPanelHistoryTraversal } from '@/lib/panel-history'

// Vite selects this implementation; Next keeps the pages-router hook.
export const usePreventNavigationOnUnsavedChanges = ({ hasChanges }: { hasChanges: boolean }) => {
  const shouldBlockFn = useCallback(() => {
    if (isPanelHistoryTraversal()) return false
    return hasChanges
  }, [hasChanges])
  const { reset, proceed, status } = useBlocker({
    shouldBlockFn,
    withResolver: true,
    enableBeforeUnload: hasChanges,
  })

  return {
    handleCancelNavigation: () => reset?.(),
    handleConfirmNavigation: () => proceed?.(),
    shouldConfirmNavigation: status === 'blocked',
  }
}
