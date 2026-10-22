import { useBlocker, type ShouldBlockFn } from '@tanstack/react-router'
import { useCallback } from 'react'

import { isPanelHistoryTraversalTo } from '@/lib/panel-history'

// Vite selects this implementation; Next keeps the pages-router hook.
export const usePreventNavigationOnUnsavedChanges = ({ hasChanges }: { hasChanges: boolean }) => {
  const shouldBlockFn = useCallback<ShouldBlockFn>(
    ({ next }) => {
      // The mapped blocker location drops href. At popstate time, location is the destination.
      const hrefValue = Reflect.get(next, 'href')
      const nextHref = typeof hrefValue === 'string' ? hrefValue : window.location.href
      if (isPanelHistoryTraversalTo(nextHref)) return false
      return hasChanges
    },
    [hasChanges]
  )
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
