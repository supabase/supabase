import { useRouter as useTanStackRouter } from '@tanstack/react-router'
// This adapter also serves the Next runtime until its migration is complete.
import Router from 'next/router'
import { useEffect, useRef } from 'react'

import { useLatest } from '@/hooks/misc/useLatest'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { getHistoryPosition } from '@/lib/navigation-history'

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
    if (router) {
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
    }

    let currentHref = window.location.href
    let currentState: unknown = window.history.state
    const cancellation = new Error('Navigation cancelled')
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason !== cancellation) return
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    let currentPosition = getHistoryPosition(window.history.state) ?? 0
    let restorePosition: number | undefined
    let pendingDelta: number | undefined
    const pathname = window.location.pathname
    const samePage = (href: string) => new URL(href, window.location.href).pathname === pathname
    const handleRouteChange = (href: string) => {
      if (!latest.current.hasChanges || canLeave.current || samePage(href)) return
      latest.current.requestNavigation(() => {
        void Router.push(href)
      })
      Router.events.emit('routeChangeError', cancellation, href, { shallow: false })
      throw cancellation
    }
    const handlePop = ({ as }: { as: string }) => {
      const nextPosition = getHistoryPosition(window.history.state)
      if (restorePosition !== undefined) return false
      if (!latest.current.hasChanges || canLeave.current || samePage(as)) {
        currentPosition = nextPosition ?? currentPosition
        return true
      }
      if (nextPosition === undefined) {
        // An older, untracked entry cannot be reversed reliably. Restore the
        // visible URL and confirm before leaving via a document navigation.
        window.history.replaceState(currentState, '', currentHref)
        latest.current.requestNavigation(() => window.location.assign(as))
        return false
      }
      pendingDelta = nextPosition - currentPosition
      restorePosition = currentPosition
      window.history.go(-pendingDelta)
      return false
    }
    const handleRestoredPop = () => {
      if (
        restorePosition === undefined ||
        getHistoryPosition(window.history.state) !== restorePosition
      )
        return
      restorePosition = undefined
      const delta = pendingDelta
      pendingDelta = undefined
      if (delta !== undefined) latest.current.requestNavigation(() => window.history.go(delta))
    }
    const handleComplete = () => {
      currentHref = window.location.href
      currentState = window.history.state
      currentPosition = getHistoryPosition(window.history.state) ?? currentPosition
    }
    window.addEventListener('unhandledrejection', handleRejection, true)
    window.addEventListener('popstate', handleRestoredPop)
    Router.beforePopState(handlePop)
    Router.events.on('routeChangeStart', handleRouteChange)
    Router.events.on('routeChangeComplete', handleComplete)
    return () => {
      window.removeEventListener('unhandledrejection', handleRejection, true)
      window.removeEventListener('popstate', handleRestoredPop)
      Router.beforePopState(() => true)
      Router.events.off('routeChangeStart', handleRouteChange)
      Router.events.off('routeChangeComplete', handleComplete)
    }
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
