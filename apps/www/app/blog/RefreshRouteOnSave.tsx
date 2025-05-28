'use client'

import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React from 'react'

export const RefreshRouteOnSave: React.FC<{ serverURL: string }> = ({ serverURL }) => {
  const router = useRouter()

  return <PayloadLivePreview refresh={() => router.refresh()} serverURL={serverURL} />
}
