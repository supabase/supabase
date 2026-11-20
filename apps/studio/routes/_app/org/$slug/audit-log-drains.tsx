import { createFileRoute } from '@tanstack/react-router'
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
import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'

export const Route = createFileRoute('/_app/org/$slug/audit-log-drains')({
  component: OrgAuditLogDrainsRoute,
  staticData: {
    orgLayoutTitle: 'Audit Log Drains',
  },
})

function OrgAuditLogDrainsRoute() {
  return (
    <OrganizationSettingsLayout>
      <OrgAuditLogDrainsPage />
    </OrganizationSettingsLayout>
  )
}

function OrgAuditLogDrainsPage() {
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
