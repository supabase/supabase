'use client'

import { IS_PLATFORM, PageTelemetry } from 'common'
import { useConsentToast } from 'ui-patterns/consent'
import { API_URL } from '~/lib/constants'

interface ConsentWrapperProps {
  children: React.ReactNode
}

export function ConsentWrapper({ children }: ConsentWrapperProps) {
  const { hasAcceptedConsent } = useConsentToast()

  return (
    <>
      {children}
      <PageTelemetry
        API_URL={API_URL}
        hasAcceptedConsent={hasAcceptedConsent}
        enabled={IS_PLATFORM}
      />
    </>
  )
}
