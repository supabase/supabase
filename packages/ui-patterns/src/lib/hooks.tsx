import { ConsentToast } from '@ui-patterns/ConsentToast'
import { LOCAL_STORAGE_KEYS, handlePageTelemetry, isBrowser, useTelemetryProps } from 'common'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

// Use with PortalToast from 'ui/src/layout/PortalToast'
export const useConsent = () => {
  const { TELEMETRY_CONSENT } = LOCAL_STORAGE_KEYS
  const consentToastId = useRef<string>()
  const isClient = typeof window !== 'undefined'
  if (!isClient) return {}
  const telemetryProps = useTelemetryProps()
  const [consentValue, setConsentValue] = useState<string | null>(
    localStorage?.getItem(TELEMETRY_CONSENT)
  )

  const handleConsent = (value: 'true' | 'false') => {
    if (!isClient) return
    setConsentValue(value)
    localStorage.setItem(TELEMETRY_CONSENT, value)

    if (consentToastId.current) toast.dismiss(consentToastId.current)
    if (value === 'true')
      handlePageTelemetry(process.env.NEXT_PUBLIC_API_URL!, location.pathname, telemetryProps)
  }

  useEffect(() => {
    const handleSetLocalStorage = () => {
      if (localStorage?.getItem(TELEMETRY_CONSENT)) toast.dismiss(consentToastId.current)
    }

    window.addEventListener('storage', handleSetLocalStorage)
    return window.removeEventListener('storage', () => null)
  }, [])

  useEffect(() => {
    if (isClient && consentValue === null) {
      consentToastId.current = toast(
        <ConsentToast
          onAccept={() => handleConsent('true')}
          onOptOut={() => handleConsent('false')}
        />,
        {
          id: 'consent-toast',
          position: 'bottom-right',
          duration: Infinity,
        }
      )
    }
  }, [consentValue])

  return { consentValue, setConsentValue, hasAcceptedConsent: consentValue === 'true' }
}

export const useConsentValue = (KEY_NAME: string) => {
  if (!isBrowser) return {}

  const telemetryProps = useTelemetryProps()
  const [consentValue, setConsentValue] = useState<string | null>(localStorage?.getItem(KEY_NAME))

  const handleConsent = (value: 'true' | 'false') => {
    if (!isBrowser) return
    setConsentValue(value)
    localStorage.setItem(KEY_NAME, value)
    window.dispatchEvent(new Event('storage'))
    if (value === 'true')
      handlePageTelemetry(process.env.NEXT_PUBLIC_API_URL!, location.pathname, telemetryProps)
  }

  return {
    consentValue,
    setConsentValue,
    hasAccepted: consentValue === 'true',
    handleConsent,
  }
}
