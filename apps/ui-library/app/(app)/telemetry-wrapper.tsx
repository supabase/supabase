'use client'

import { API_URL } from '@/lib/constants'
import { IS_PLATFORM, PageTelemetry } from 'common'
import { useConsent } from 'ui-patterns/ConsentToast'

export const TelemetryWrapper = () => {
  const { hasAcceptedConsent } = useConsent()
  return (
    <PageTelemetry
      API_URL={API_URL}
      hasAcceptedConsent={hasAcceptedConsent}
      enabled={IS_PLATFORM}
    />
  )
}
