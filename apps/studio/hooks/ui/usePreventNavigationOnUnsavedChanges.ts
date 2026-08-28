import { useBlocker } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'

interface UsePreventNavigationOnUnsavedChangesOptions {
  /*
   * Boolean indicating whether there are changes that would be lost if users navigate to another
   * page or close the browser tab
   */
  hasChanges: boolean
}

interface UsePreventNavigationOnUnsavedChangesReturn {
  /*
   * Cancel the navigation and keep the changes
   */
  handleCancelNavigation: () => void
  /*
   * Confirm the blocked navigation and lose the changes
   */
  handleConfirmNavigation: () => void
  /*
   * Skip the guard before an intentional navigation that has already been confirmed
   */
  bypassNavigationGuard: () => void
  /*
   * Boolean indicating whether UI to request users confirmation for the navigation should be
   * displayed
   */
  shouldConfirmNavigation: boolean
}

/*
 * Prevents in-app navigation and tab close when users could lose changes.
 *
 * Studio's `next/router` is a TanStack shim, so throwing from `routeChangeStart` cannot cancel
 * navigation. TanStack's `useBlocker` handles both the block and its eventual resolution.
 */
export const usePreventNavigationOnUnsavedChanges = ({
  hasChanges,
}: UsePreventNavigationOnUnsavedChangesOptions): UsePreventNavigationOnUnsavedChangesReturn => {
  const [allowNavigation, setAllowNavigation] = useState(false)
  const shouldGuard = hasChanges && !allowNavigation

  const blocker = useBlocker({
    shouldBlockFn: () => shouldGuard,
    withResolver: true,
    enableBeforeUnload: shouldGuard,
    disabled: !shouldGuard,
  })

  const handleCancelNavigation = useCallback(() => {
    blocker.reset?.()
  }, [blocker])

  const handleConfirmNavigation = useCallback(() => {
    flushSync(() => setAllowNavigation(true))
    blocker.proceed?.()
  }, [blocker])

  const bypassNavigationGuard = useCallback(() => {
    flushSync(() => setAllowNavigation(true))
  }, [])

  return useMemo(
    () => ({
      handleCancelNavigation,
      handleConfirmNavigation,
      bypassNavigationGuard,
      shouldConfirmNavigation: blocker.status === 'blocked',
    }),
    [blocker.status, handleCancelNavigation, handleConfirmNavigation, bypassNavigationGuard]
  )
}
