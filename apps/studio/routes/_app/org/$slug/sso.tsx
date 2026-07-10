import { createFileRoute } from '@tanstack/react-router'

import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import OrgSSOPage from '@/pages/org/[slug]/sso'

export const Route = createFileRoute('/_app/org/$slug/sso')({
  component: OrgSSO,
  staticData: {
    orgLayoutTitle: 'SSO',
  },
})

function OrgSSO() {
  return (
    <OrganizationSettingsLayout>
      <OrgSSOPage dehydratedState={undefined} />
    </OrganizationSettingsLayout>
  )
}
