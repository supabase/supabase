import { createFileRoute } from '@tanstack/react-router'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { OAuthApps } from '@/components/interfaces/Organization/OAuthApps/OAuthApps'
import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'

export const Route = createFileRoute('/_app/org/$slug/apps')({
  component: OrgApps,
  staticData: {
    orgLayoutTitle: 'OAuth Apps',
  },
})

function OrgApps() {
  return (
    <OrganizationSettingsLayout>
      <OrgOAuthAppsPage />
    </OrganizationSettingsLayout>
  )
}

function OrgOAuthAppsPage() {
  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>OAuth Apps</PageHeaderTitle>
            <PageHeaderDescription>
              Published and authorized OAuth applications
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <OAuthApps />
    </>
  )
}
