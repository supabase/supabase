'use client'

import { IS_PLATFORM, PageObservability as PageObservabilityImpl } from 'common'
import { useConsentToast } from 'ui-patterns/consent'
import { API_URL } from '~/lib/constants'

const PageObservability = () => {
  const { hasAcceptedConsent } = useConsentToast()

  return (
    <PageObservabilityImpl
      API_URL={API_URL}
      hasAcceptedConsent={hasAcceptedConsent}
      enabled={IS_PLATFORM}
    />
  )
}

export { PageObservability }
