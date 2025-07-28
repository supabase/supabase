'use client'

import { consentState, isBrowser, LOCAL_STORAGE_KEYS } from 'common'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { cn } from 'ui'
import { useSnapshot } from 'valtio'
import { ConsentToast } from './ConsentToast'

const { TELEMETRY_DATA } = LOCAL_STORAGE_KEYS

export const useConsentToast = () => {
  const consentToastId = useRef<string | number>()
  const snap = useSnapshot(consentState)

  const acceptAll = useCallback(() => {
    if (!isBrowser) return

    snap.acceptAll()

    if (consentToastId.current) {
      toast.dismiss(consentToastId.current)
    }
  }, [snap.acceptAll])

  const denyAll = useCallback(() => {
    if (!isBrowser) return

    snap.denyAll()
    // remove the telemetry cookie
    document.cookie = `${TELEMETRY_DATA}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`

    if (consentToastId.current) {
      toast.dismiss(consentToastId.current)
    }
  }, [snap.denyAll])

  useEffect(() => {
    if (isBrowser && snap.showConsentToast) {
      consentToastId.current = toast(<ConsentToast onAccept={acceptAll} onOptOut={denyAll} />, {
        id: 'consent-toast',
        position: 'bottom-right',
        duration: Infinity,
        closeButton: false,
        dismissible: false,
        className: cn(
          '!w-screen !fixed !border-t !h-auto !left-0 !bottom-0 !top-auto !right-0 !rounded-none !max-w-none !bg-overlay !text',
          'sm:!w-full sm:!max-w-[356px] sm:!left-auto sm:!right-8 sm:!bottom-8 sm:!rounded-lg sm:border'
        ),
      })
    } else if (consentToastId.current) {
      toast.dismiss(consentToastId.current)
    }
  }, [snap.showConsentToast])

  return {
    hasAcceptedConsent: snap.hasConsented,
  }
}
