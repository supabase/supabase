'use client'

import { RouteParamsOverrideProvider } from 'common'
import { useParams } from 'next/navigation'
import { useMemo, type PropsWithChildren } from 'react'

import { useV2Params } from '@/app/v2/V2ParamsContext'

export function V2IntegrationRouteShell({ children }: PropsWithChildren) {
  const params = useParams()
  const { projectRef } = useV2Params()
  const id = params?.id as string | undefined
  const pageId = params?.pageId as string | undefined
  const childId = params?.childId as string | undefined

  const override = useMemo(
    () => ({ ref: projectRef, id, pageId, childId }),
    [projectRef, id, pageId, childId]
  )
  if (!projectRef || !id) return null

  return (
    <RouteParamsOverrideProvider value={override}>{children}</RouteParamsOverrideProvider>
  )
}
