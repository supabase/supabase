import { createFileRoute } from '@tanstack/react-router'

import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import OrgSecuritySettingsPage from '@/pages/org/[slug]/security'

export const Route = createFileRoute('/_app/org/$slug/security')({
  component: OrgSecurity,
  staticData: {
    orgLayoutTitle: 'Security',
  },
})

function OrgSecurity() {
  return (
    <OrganizationSettingsLayout>
      <OrgSecuritySettingsPage dehydratedState={undefined} />
    </OrganizationSettingsLayout>
  )
}
