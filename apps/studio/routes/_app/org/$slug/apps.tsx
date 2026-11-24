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
  validateSearch: (search: Record<string, unknown>) => ({
    mock_scenario: typeof search.mock_scenario === 'string' ? search.mock_scenario : undefined,
    ...(typeof search.access_app === 'string' ? { access_app: search.access_app } : {}),
  }),
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
