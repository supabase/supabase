import { useRouter as useTanStackRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { useLatest } from '@/hooks/misc/useLatest'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'

export const usePipelineNavigationGuard = (hasChanges: boolean) => {
  const router = useTanStackRouter({ warn: false })
  const canLeave = useRef(false)
  const pending = useRef<(() => void) | undefined>(undefined)
  const cancelPending = useRef<(() => void) | undefined>(undefined)
  const { confirmOnClose, modalProps } = useConfirmOnClose({
    checkIsDirty: () => hasChanges,
    onClose: () => {
      canLeave.current = true
      pending.current?.()
    },
  })
  const requestNavigation = (proceed: () => void, cancel?: () => void) => {
    // Keep the first requested destination while its confirmation is open.
    if (pending.current) {
      cancel?.()
      return
    }
    pending.current = proceed
    cancelPending.current = cancel
    confirmOnClose()
  }
  const latest = useLatest({ hasChanges, requestNavigation })

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!latest.current.hasChanges || canLeave.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [latest])

  useEffect(() => {
    if (!router) return
    return router.history.block({
      enableBeforeUnload: false,
      blockerFn: ({ currentLocation, nextLocation }) => {
        if (
          !latest.current.hasChanges ||
          canLeave.current ||
          currentLocation.pathname === nextLocation.pathname
        )
          return false
        return new Promise<boolean>((resolve) => {
          latest.current.requestNavigation(
            () => resolve(false),
            () => resolve(true)
          )
        })
      },
    })
  }, [router, latest])

  return {
    requestNavigation,
    modalProps: {
      ...modalProps,
      onCancel: () => {
        cancelPending.current?.()
        pending.current = undefined
        cancelPending.current = undefined
        modalProps.onCancel()
      },
    },
  }
}
