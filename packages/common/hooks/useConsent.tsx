import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import ConsentToast from 'ui/src/components/ConsentToast'

// Use with PortalToast from 'ui/src/layout/PortalToast'
export const useConsent = () => {
  const consentToastId = useRef<string>()
  const isClient = typeof window !== 'undefined'
  if (!isClient) return {}
  const TELEMETRY_CONSENT = 'supabase-consent'
  const [consentValue, setConsentValue] = useState<string | null>(
    localStorage?.getItem(TELEMETRY_CONSENT)
  )

  const handleConsent = (value: 'true' | 'false') => {
    if (!isClient) return
    setConsentValue(value)
    localStorage.setItem(TELEMETRY_CONSENT, value)

    if (consentToastId.current) toast.dismiss(consentToastId.current)
  }

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
