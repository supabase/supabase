import { useRouter as useTanStackRouter } from '@tanstack/react-router'
import { useRouter as useNextRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { BASE_PATH } from '@/lib/constants'

interface UsePreventNavigationOnUnsavedChangesOptions {
  hasChanges: boolean
}

interface UsePreventNavigationOnUnsavedChangesReturn {
  handleCancelNavigation: () => void
  handleConfirmNavigation: () => void
  bypassNavigationGuard: () => void
  shouldConfirmNavigation: boolean
}

interface PendingTanStackNavigation {
  proceed: () => void
  reset: () => void
}

/*
 * Prevents in-app navigation and tab close when users could lose changes.
 *
 * Studio ships Next and TanStack Router side by side. TanStack navigation must be blocked through
 * its history API before the route starts rendering; Next continues to use routeChangeStart.
 */
export const usePreventNavigationOnUnsavedChanges = ({
  hasChanges,
}: UsePreventNavigationOnUnsavedChangesOptions): UsePreventNavigationOnUnsavedChangesReturn => {
  const nextRouter = useNextRouter()
  const tanStackRouter = useTanStackRouter({ warn: false })
  const [navigateUrl, setNavigateUrl] = useState<string>()
  const [confirmNavigate, setConfirmNavigate] = useState(false)
  const [pendingTanStackNavigation, setPendingTanStackNavigation] =
    useState<PendingTanStackNavigation>()
  const bypassNavigationGuardRef = useRef(false)

  useEffect(() => {
    if (!tanStackRouter || !hasChanges) return

    return tanStackRouter.history.block({
      enableBeforeUnload: true,
      blockerFn: async () => {
        if (bypassNavigationGuardRef.current) {
          bypassNavigationGuardRef.current = false
          return false
        }

        const shouldCancelNavigation = await new Promise<boolean>((resolve) => {
          setPendingTanStackNavigation({
            proceed: () => resolve(false),
            reset: () => resolve(true),
          })
        })
        setPendingTanStackNavigation(undefined)
        return shouldCancelNavigation
      },
    })
  }, [hasChanges, tanStackRouter])

  useEffect(() => {
    if (tanStackRouter) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasChanges) {
        event.preventDefault()
        event.returnValue = ''
      }
    }

    const handleBrowseAway = (url: string) => {
      if (bypassNavigationGuardRef.current) {
        bypassNavigationGuardRef.current = false
        setNavigateUrl(undefined)
        return
      }

      if (hasChanges && !confirmNavigate) {
        setNavigateUrl(url)
        throw 'Route change declined'
      }
      setNavigateUrl(undefined)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    nextRouter.events.on('routeChangeStart', handleBrowseAway)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      nextRouter.events.off('routeChangeStart', handleBrowseAway)
    }
  }, [confirmNavigate, hasChanges, nextRouter.events, tanStackRouter])

  const handleCancelNavigation = useCallback(() => {
    pendingTanStackNavigation?.reset()
    setNavigateUrl(undefined)
  }, [pendingTanStackNavigation])

  const handleConfirmNavigation = useCallback(() => {
    if (pendingTanStackNavigation) {
      pendingTanStackNavigation.proceed()
      return
    }

    setConfirmNavigate(true)
    let urlToNavigate = navigateUrl ?? '/'
    if (BASE_PATH && urlToNavigate.startsWith(BASE_PATH)) {
      urlToNavigate = urlToNavigate.slice(BASE_PATH.length) || '/'
    }
    if (!urlToNavigate.startsWith('/')) urlToNavigate = `/${urlToNavigate}`
    setNavigateUrl(undefined)
    nextRouter.push(urlToNavigate)
  }, [navigateUrl, nextRouter, pendingTanStackNavigation])

  const bypassNavigationGuard = useCallback(() => {
    bypassNavigationGuardRef.current = true
  }, [])

  return useMemo(
    () => ({
      handleCancelNavigation,
      handleConfirmNavigation,
      bypassNavigationGuard,
      shouldConfirmNavigation: pendingTanStackNavigation !== undefined || navigateUrl !== undefined,
    }),
    [
      handleCancelNavigation,
      handleConfirmNavigation,
      bypassNavigationGuard,
      navigateUrl,
      pendingTanStackNavigation,
    ]
  )
}
