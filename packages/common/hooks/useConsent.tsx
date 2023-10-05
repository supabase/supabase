import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import ConsentToast from 'ui/src/components/ConsentToast'
import { handlePageTelemetry } from '../telemetry'
import { useTelemetryProps } from './useTelemetryProps'
import { LOCAL_STORAGE_KEYS } from '../constants'

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
