'use client'

import { IS_PLATFORM, PageTelemetry as PageTelemetryImpl } from 'common'
import { useConsent } from 'ui-patterns/ConsentToast'
import { API_URL } from '~/lib/constants'

const PageTelemetry = () => {
  const { hasAcceptedConsent } = useConsent()

  return (
    <PageTelemetryImpl
      API_URL={API_URL}
      hasAcceptedConsent={hasAcceptedConsent}
      enabled={IS_PLATFORM}
    />
  )
}

export { PageTelemetry }
