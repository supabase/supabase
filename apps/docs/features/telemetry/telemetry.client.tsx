'use client'

import { API_URL } from '~/lib/constants'
import { IS_PLATFORM, PageTelemetry as PageTelemetryImpl } from 'common'
import { useConsentToast } from 'ui-patterns/consent'

const PageTelemetry = () => {
  const { hasAcceptedConsent } = useConsentToast()

  return (
    <PageTelemetryImpl
      API_URL={API_URL}
      platform="docs"
      hasAcceptedConsent={hasAcceptedConsent}
      enabled={IS_PLATFORM}
    />
  )
}

export { PageTelemetry }
