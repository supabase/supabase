import { useState } from 'react'
import { isBrowser } from '../helpers'

export const useConsentValue = (KEY_NAME: string) => {
  if (!isBrowser) return {}

  const [consentValue, setConsentValue] = useState<string | null>(localStorage?.getItem(KEY_NAME))

  const handleConsent = (value: 'true' | 'false') => {
    if (!isBrowser) return
    setConsentValue(value)
    localStorage.setItem(KEY_NAME, value)
    if (value === 'true') location.reload()
  }

  return {
    consentValue,
    setConsentValue,
    hasAccepted: consentValue === 'true',
    handleConsent,
  }
}
