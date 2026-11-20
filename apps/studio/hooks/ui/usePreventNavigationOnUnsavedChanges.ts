import { useBlocker } from '@tanstack/react-router'
import { useCallback } from 'react'

export const usePreventNavigationOnUnsavedChanges = ({ hasChanges }: { hasChanges: boolean }) => {
  const shouldBlockFn = useCallback(() => hasChanges, [hasChanges])
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
