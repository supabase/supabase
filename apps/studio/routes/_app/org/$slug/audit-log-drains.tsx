import { createFileRoute } from '@tanstack/react-router'

import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import OrgAuditLogDrainsPage from '@/pages/org/[slug]/audit-log-drains'

export const Route = createFileRoute('/_app/org/$slug/audit-log-drains')({
  component: OrgAuditLogDrains,
  staticData: {
    orgLayoutTitle: 'Audit Log Drains',
  },
})

function OrgAuditLogDrains() {
  return (
    <OrganizationSettingsLayout>
      <OrgAuditLogDrainsPage dehydratedState={undefined} />
    </OrganizationSettingsLayout>
  )
}
