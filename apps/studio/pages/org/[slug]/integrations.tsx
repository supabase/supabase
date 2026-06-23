import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { IntegrationSettings } from '@/components/interfaces/Organization/IntegrationSettings/IntegrationSettings'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import OrganizationLayout from '@/components/layouts/OrganizationLayout'
import type { NextPageWithLayout } from '@/types'

const OrgIntegrationSettings: NextPageWithLayout = () => {
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

OrgIntegrationSettings.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="Integrations">{page}</OrganizationLayout>
  </DefaultLayout>
)

export default OrgIntegrationSettings
