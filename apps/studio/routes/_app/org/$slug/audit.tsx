import { createFileRoute } from '@tanstack/react-router'

import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import OrgAuditLogsPage from '@/pages/org/[slug]/audit'

export const Route = createFileRoute('/_app/org/$slug/audit')({
  component: OrgAudit,
  staticData: {
    orgLayoutTitle: 'Audit Logs',
  },
})

function OrgAudit() {
  return (
    <OrganizationSettingsLayout>
      <OrgAuditLogsPage dehydratedState={undefined} />
    </OrganizationSettingsLayout>
  )
}
