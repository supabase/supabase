import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import ConsentToast from 'ui/src/components/ConsentToast'
import { isBrowser } from '../helpers'

// Use with PortalToast from 'ui/src/layout/PortalToast'
export const useTelemetryConsent = () => {
  const consentToastId = useRef<string>()
  if (!isBrowser) return {}
  const TELEMETRY_CONSENT = 'supabase-consent'
  const [consentValue, setConsentValue] = useState<string | null>(
    localStorage?.getItem(TELEMETRY_CONSENT)
  )

  const handleConsent = (value: 'true' | 'false') => {
    if (!isBrowser) return
    setConsentValue(value)
    localStorage.setItem(TELEMETRY_CONSENT, value)

    if (consentToastId.current) toast.dismiss(consentToastId.current)
  }

  useEffect(() => {
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
        }
      )
    }
  }, [consentValue])

  return { consentValue, setConsentValue, hasAcceptedConsent: consentValue === 'true' }
}
