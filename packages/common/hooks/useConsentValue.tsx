import { useState } from 'react'
import { isBrowser } from '../helpers'
import { handlePageTelemetry } from '../telemetry'
import { useTelemetryProps } from './useTelemetryProps'

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
