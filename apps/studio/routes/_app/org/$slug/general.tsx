import { createFileRoute } from '@tanstack/react-router'

import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import OrgGeneralSettingsPage from '@/pages/org/[slug]/general'

export const Route = createFileRoute('/_app/org/$slug/general')({
  component: OrgGeneral,
  staticData: {
    orgLayoutTitle: 'General',
  },
})

function OrgGeneral() {
  return (
    <OrganizationSettingsLayout>
      <OrgGeneralSettingsPage dehydratedState={undefined} />
    </OrganizationSettingsLayout>
  )
}
