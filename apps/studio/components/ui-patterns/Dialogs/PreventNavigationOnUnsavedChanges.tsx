import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { BASE_PATH } from 'lib/constants'

import {
  DiscardChangesConfirmationDialog,
  type DiscardChangesConfirmationDialogProps,
} from './DiscardChangesConfirmationDialog'

export const PreventNavigationOnUnsavedChanges = ({
  hasChanges,
  ...props
}: { hasChanges: boolean } & Omit<
  DiscardChangesConfirmationDialogProps,
  'visible' | 'onClose' | 'onCancel'
>) => {
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

  const handleCancel = () => {
    setNavigateUrl(undefined)
  }

  const handleClose = () => {
    setConfirmNavigate(true)
    let urlToNavigate = navigateUrl ?? '/'
    if (BASE_PATH && urlToNavigate.startsWith(BASE_PATH)) {
      urlToNavigate = urlToNavigate.slice(BASE_PATH.length) || '/'
    }
    if (!urlToNavigate.startsWith('/')) urlToNavigate = `/${urlToNavigate}`
    setNavigateUrl(undefined)
    router.push(urlToNavigate)
  }

  return (
    <DiscardChangesConfirmationDialog
      visible={!!navigateUrl}
      onCancel={handleCancel}
      onClose={handleClose}
      {...props}
    />
  )
}
