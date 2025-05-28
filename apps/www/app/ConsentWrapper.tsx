'use client'

import { IS_PLATFORM, PageTelemetry } from 'common'
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'
import { useConsentToast } from 'ui-patterns/consent'
import { useRouter } from 'next/navigation'
import { API_URL } from '~/lib/constants'

interface ConsentWrapperProps {
  children: React.ReactNode
}

export function ConsentWrapper({ children }: ConsentWrapperProps) {
  const { hasAcceptedConsent } = useConsentToast()
  const router = useRouter()

  return (
    <>
      {children}
      <PageTelemetry
        API_URL={API_URL}
        hasAcceptedConsent={hasAcceptedConsent}
        enabled={IS_PLATFORM}
      />
      <PayloadLivePreview
        refresh={() => router.refresh()}
        serverURL={process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3030'}
      />
    </>
  )
}
