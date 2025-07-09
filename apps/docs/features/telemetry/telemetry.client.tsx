'use client'

import { IS_PLATFORM, PageTelemetry as PageTelemetryImpl } from 'common'
import { useConsentToast } from 'ui-patterns/consent'
import { API_URL } from '~/lib/constants'

const PageTelemetry = () => {
  const { hasAcceptedConsent } = useConsentToast()

  return (
    <PageTelemetryImpl
      API_URL={API_URL}
      hasAcceptedConsent={hasAcceptedConsent}
      enabled={IS_PLATFORM}
    />
  )
}

export { PageTelemetry }
