import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { IntegrationSettings } from '@/components/interfaces/Organization/IntegrationSettings/IntegrationSettings'

export const Route = createFileRoute('/_app/org/$slug/integrations')({
  component: OrgIntegrationSettingsPage,
  staticData: {
    orgLayoutTitle: 'Integrations',
  },
})

function OrgIntegrationSettingsPage() {
  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Integrations</PageHeaderTitle>
            <PageHeaderDescription>
              Connect external services to your organization
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="small">
        <IntegrationSettings />
      </PageContainer>
    </>
  )
}
