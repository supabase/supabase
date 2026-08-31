import { IS_PLATFORM, useFlag, useParams } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { OrgAuditLogDrains } from '@/components/interfaces/LogDrains/OrgAuditLogDrains'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import OrganizationLayout from '@/components/layouts/OrganizationLayout'
import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import type { NextPageWithLayout } from '@/types'

const OrgAuditLogDrainsPage: NextPageWithLayout = () => {
  const { slug } = useParams()
  const showAuditLogDrains = useFlag('auditLogsLogDrain')

  if (!IS_PLATFORM || !showAuditLogDrains) {
    return <UnknownInterface urlBack={`/org/${slug}/audit`} />
  }

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Audit Log Drains</PageHeaderTitle>
            <PageHeaderDescription>
              Export your organization audit logs to third party destinations
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default" className="pt-8">
        <OrgAuditLogDrains />
      </PageContainer>
    </>
  )
}

OrgAuditLogDrainsPage.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="Audit Log Drains">
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default OrgAuditLogDrainsPage
