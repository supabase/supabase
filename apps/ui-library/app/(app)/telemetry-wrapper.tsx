'use client'

import { IS_PLATFORM, PageTelemetry } from 'common'
import { useConsentToast } from 'ui-patterns/consent'

import { API_URL } from '@/lib/constants'

export const TelemetryWrapper = () => {
  const { hasAcceptedConsent } = useConsentToast()
  return (
    <PageTelemetry
      API_URL={API_URL}
      hasAcceptedConsent={hasAcceptedConsent}
      enabled={IS_PLATFORM}
    />
  )
}
