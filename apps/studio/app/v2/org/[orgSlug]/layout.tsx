'use client'

import { RouteParamsOverrideProvider } from 'common'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { useParams } from 'next/navigation'

import { V2OrgParamsProvider } from '@/app/v2/V2ParamsContext'

export default function V2OrgProjectsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined

  return (
    <RouteParamsOverrideProvider value={{ slug: orgSlug }}>
      <V2OrgParamsProvider>
        <OrganizationLayout title="Projects">
          <PageLayout title="Projects">{children}</PageLayout>
        </OrganizationLayout>
      </V2OrgParamsProvider>
    </RouteParamsOverrideProvider>
  )
}
