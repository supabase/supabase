'use client'

import { useParams } from 'next/navigation'
import type { PropsWithChildren } from 'react'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import EdgeFunctionDetailsLayout from '@/components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import { RouteParamsOverrideProvider } from 'common'

export function V2EdgeFunctionRouteShell({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  const params = useParams()
  const { projectRef } = useV2Params()
  const slug = params?.functionSlug as string

  if (!projectRef || !slug) return null

  return (
    <RouteParamsOverrideProvider value={{ ref: projectRef, functionSlug: slug }}>
      <EdgeFunctionDetailsLayout title={title}>{children}</EdgeFunctionDetailsLayout>
    </RouteParamsOverrideProvider>
  )
}
