'use client'

import {
  consentState,
  handlePageTelemetry,
  isBrowser,
  LOCAL_STORAGE_KEYS,
  useFeatureFlags,
} from 'common'
import { useRouter } from 'next/compat/router'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { cn } from 'ui'
import { useSnapshot } from 'valtio'
import { ConsentToast } from './ConsentToast'

export const useConsentToast = () => {
  const { TELEMETRY_DATA } = LOCAL_STORAGE_KEYS
  const consentToastId = useRef<string | number>()
  const router = useRouter()
  const appRouterPathname = usePathname()
  const featureFlags = useFeatureFlags()

  const snap = useSnapshot(consentState)
  const pathname =
    router?.pathname ?? appRouterPathname ?? (isBrowser ? window.location.pathname : '')

  const handleConsent = (value: 'true' | 'false') => {
    if (!isBrowser) return

    if (value === 'true') {
      snap.acceptAll()
      const cookies = document.cookie.split(';')
      const telemetryCookie = cookies.find((cookie) => cookie.trim().startsWith(TELEMETRY_DATA))
      if (telemetryCookie) {
        try {
          const encodedData = telemetryCookie.split('=')[1]
          const telemetryData = JSON.parse(decodeURIComponent(encodedData))
          handlePageTelemetry(
            process.env.NEXT_PUBLIC_API_URL!,
            pathname,
            featureFlags.posthog,
            telemetryData
          )
          // remove the telemetry cookie
          document.cookie = `${TELEMETRY_DATA}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        } catch (error) {
          console.error('Invalid telemetry data:', error)
        }
      } else {
        handlePageTelemetry(process.env.NEXT_PUBLIC_API_URL!, pathname, featureFlags.posthog)
      }
    } else {
      snap.denyAll()
      // remove the telemetry cookie
      document.cookie = `${TELEMETRY_DATA}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }

    if (consentToastId.current) {
      toast.dismiss(consentToastId.current)
    }
  }

  useEffect(() => {
    if (isBrowser && snap.showConsentToast) {
      consentToastId.current = toast(
        <ConsentToast
          onAccept={() => handleConsent('true')}
          onOptOut={() => handleConsent('false')}
        />,
        {
          id: 'consent-toast',
          position: 'bottom-right',
          duration: Infinity,
          closeButton: false,
          dismissible: false,
          className: cn(
            '!w-screen !fixed !border-t !h-auto !left-0 !bottom-0 !top-auto !right-0 !rounded-none !max-w-none !bg-overlay !text',
            'sm:!w-full sm:!max-w-[356px] sm:!left-auto sm:!right-8 sm:!bottom-8 sm:!rounded-lg sm:border'
          ),
        }
      )
    } else if (consentToastId.current) {
      toast.dismiss(consentToastId.current)
    }
  }, [snap.showConsentToast])

  return {
    hasAcceptedConsent: snap.hasConsented,
  }
}
