import { LOCAL_STORAGE_KEYS, handlePageTelemetry, isBrowser } from 'common'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { proxy, useSnapshot } from 'valtio'
import { useRouter } from 'next/compat/router'
import { usePathname } from 'next/navigation'
import { useFeatureFlags } from 'common'
import { cn } from 'ui'
import { ConsentToast } from '../ConsentToast'

const consentState = proxy({
  consentValue: (isBrowser ? localStorage?.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT) : null) as
    | string
    | null,
  setConsentValue: (value: string | null) => {
    consentState.consentValue = value
  },
})

export const useConsent = () => {
  const { TELEMETRY_CONSENT, TELEMETRY_DATA } = LOCAL_STORAGE_KEYS
  const consentToastId = useRef<string | number>()
  const router = useRouter()
  const appRouterPathname = usePathname()
  const featureFlags = useFeatureFlags()

  const { consentValue } = useSnapshot(consentState)
  const pathname =
    router?.pathname ?? appRouterPathname ?? (isBrowser ? window.location.pathname : '')

  const handleConsent = (value: 'true' | 'false') => {
    if (!isBrowser) return

    if (value === 'true') {
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
      // remove the telemetry cookie
      document.cookie = `${TELEMETRY_DATA}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }

    consentState.setConsentValue(value)
    localStorage.setItem(TELEMETRY_CONSENT, value)

    if (consentToastId.current) {
      toast.dismiss(consentToastId.current)
    }
  }

  const triggerConsentToast = useCallback(() => {
    if (isBrowser && consentValue === null) {
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
    }
  }, [])

  useEffect(() => {
    const handleSetLocalStorage = () => {
      if (localStorage?.getItem(TELEMETRY_CONSENT)) toast.dismiss(consentToastId.current)
    }

    if (isBrowser) {
      window.addEventListener('storage', handleSetLocalStorage)
      return window.removeEventListener('storage', () => null)
    }
  }, [])

  useEffect(() => {
    setTimeout(() => {
      consentValue === null && triggerConsentToast()
    }, 300)
  }, [consentValue])

  return {
    consentValue,
    hasAcceptedConsent: consentValue === 'true',
    triggerConsentToast,
  }
}

export const useConsentValue = (KEY_NAME: string) => {
  const initialValue = isBrowser ? localStorage?.getItem(KEY_NAME) : null
  const [consentValue, setConsentValue] = useState<string | null>(initialValue)

  const handleConsent = (value: 'true' | 'false') => {
    if (!isBrowser) return
    setConsentValue(value)
    localStorage.setItem(KEY_NAME, value)
    window.dispatchEvent(new Event('storage'))
    if (value === 'true') {
      handlePageTelemetry(process.env.NEXT_PUBLIC_API_URL!, location.pathname)
    }
  }

  return {
    consentValue,
    setConsentValue,
    hasAccepted: consentValue === 'true',
    handleConsent,
  }
}
