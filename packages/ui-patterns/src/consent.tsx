'use client'

import { clearTelemetryDataCookie, consentState, isBrowser } from 'common'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { cn } from 'ui'
import { useSnapshot } from 'valtio'

import { ConsentToast } from './ConsentToast'

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
    clearTelemetryDataCookie()

    // Clear GA4 and sGTM tracking cookies
    const trackingCookies = ['_ga', '_ga_XW18KGKGNR', 'FPID', 'FPAU', 'FPLC']
    trackingCookies.forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.supabase.com`
    })

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
