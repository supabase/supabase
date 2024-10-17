'use client'

import { useEffect } from 'react'
import { useConsent } from 'ui-patterns/ConsentToast'

/**
 * Helper client component to trigger the consent toast. It has to be a client component.
 */
export const TriggerConsentToast = () => {
  const { triggerConsentToast } = useConsent()
  useEffect(() => {
    setTimeout(() => triggerConsentToast(), 1000)
  }, [triggerConsentToast])
  return null
}
