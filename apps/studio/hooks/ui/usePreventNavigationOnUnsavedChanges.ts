import { useRouter as useCompatRouter } from 'next/compat/router'
import { useRouter as useAppRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { useStaticEffectEvent } from '../useStaticEffectEvent'
import { BASE_PATH } from '@/lib/constants'

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
  handleCancel: () => void
  /*
   * Confirm the navigation and lose the changes
   */
  handleConfirm: () => void
  /*
   * Boolean indicating whether UI to request users confirmation for the navigation should be
   * displayed
   */
  shouldConfirm: boolean
}

/*
 * Hook that prevents navigation when users could lose their changes.
 * It prevents both NextJS and browser navigation (such as when closing the tab)
 */
export const usePreventNavigationOnUnsavedChanges = ({
  hasChanges,
}: UsePreventNavigationOnUnsavedChangesOptions): UsePreventNavigationOnUnsavedChangesReturn => {
  const compatRouter = useCompatRouter()
  const appRouter = useAppRouter()
  const [navigateUrl, setNavigateUrl] = useState<string>()
  const [confirmNavigate, setConfirmNavigate] = useState(false)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = '' // deprecated, but older browsers still require this
      }
    }

    const handleBrowseAway = (url: string) => {
      if (hasChanges && !confirmNavigate) {
        setNavigateUrl(url)
        throw 'Route change declined' // Just to prevent the route change
        return
      }
      setNavigateUrl(undefined)
    }

    const handleCaptureClick = (e: MouseEvent) => {
      if (!hasChanges || confirmNavigate) return

      const target = e.target
      if (!(target instanceof Element)) return

      const anchor = target.closest('a[href]')
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return
      if (e.defaultPrevented) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const hrefAttr = anchor.getAttribute('href')
      if (!hrefAttr || hrefAttr.startsWith('#')) return
      if (/^(mailto:|tel:|javascript:)/i.test(hrefAttr)) return

      let url: URL
      try {
        url = new URL(hrefAttr, window.location.href)
      } catch {
        return
      }

      if (url.origin !== window.location.origin) return

      const next = `${url.pathname}${url.search}${url.hash}`
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (next === current) return

      e.preventDefault()
      e.stopPropagation()
      setNavigateUrl(next)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    const usesPagesRouteEvents = Boolean(compatRouter?.events)

    if (usesPagesRouteEvents) {
      compatRouter!.events.on('routeChangeStart', handleBrowseAway)
    } else {
      document.addEventListener('click', handleCaptureClick, true)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (usesPagesRouteEvents) {
        compatRouter!.events.off('routeChangeStart', handleBrowseAway)
      } else {
        document.removeEventListener('click', handleCaptureClick, true)
      }
    }
  }, [compatRouter, confirmNavigate, hasChanges])

  const handleCancel = useStaticEffectEvent(() => {
    setNavigateUrl(undefined)
  })

  const handleConfirm = useStaticEffectEvent(() => {
    setConfirmNavigate(true)
    let urlToNavigate = navigateUrl ?? '/'
    if (BASE_PATH && urlToNavigate.startsWith(BASE_PATH)) {
      urlToNavigate = urlToNavigate.slice(BASE_PATH.length) || '/'
    }
    if (!urlToNavigate.startsWith('/')) urlToNavigate = `/${urlToNavigate}`
    setNavigateUrl(undefined)
    if (compatRouter) {
      void compatRouter.push(urlToNavigate)
    } else {
      void appRouter.push(urlToNavigate)
    }
  })

  return useMemo(
    () => ({
      handleCancel,
      handleConfirm,
      shouldConfirm: !!navigateUrl,
    }),
    [navigateUrl, handleCancel, handleConfirm]
  )
}
