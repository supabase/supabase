'use client'

import { useEffect, type PropsWithChildren } from 'react'

import { posthogClient, useUser } from 'common'
import { useConsentToast } from 'ui-patterns/consent'
import { CommandProvider } from 'ui-patterns/CommandMenu'
import { useDocsCommandMenuTelemetry } from '@/hooks/useDocsCommandMenuTelemetry'

export function DocsCommandProvider({ children }: PropsWithChildren) {
  const { onTelemetry } = useDocsCommandMenuTelemetry()
  const user = useUser()
  const { hasAcceptedConsent } = useConsentToast()

  useEffect(() => {
    posthogClient.init(hasAcceptedConsent)
  }, [hasAcceptedConsent])

  useEffect(() => {
    if (user?.id) {
      posthogClient.identify(user.id, { gotrue_id: user.id }, hasAcceptedConsent)
    }
  }, [user?.id, hasAcceptedConsent])

  return (
    <CommandProvider app="docs" onTelemetry={onTelemetry}>
      {children}
    </CommandProvider>
  )
}
