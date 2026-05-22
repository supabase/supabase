import { useRouter } from 'next/router'
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
  const router = useRouter()
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
    window.addEventListener('beforeunload', handleBeforeUnload)
    router.events.on('routeChangeStart', handleBrowseAway)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      router.events.off('routeChangeStart', handleBrowseAway)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmNavigate, hasChanges])

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
    router.push(urlToNavigate)
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
