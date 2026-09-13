import { createFileRoute } from '@tanstack/react-router'

import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import OrgOAuthAppsPage from '@/pages/org/[slug]/apps'

export const Route = createFileRoute('/_app/org/$slug/apps')({
  component: OrgApps,
  staticData: {
    orgLayoutTitle: 'OAuth Apps',
  },
})

function OrgApps() {
  return (
    <OrganizationSettingsLayout>
      <OrgOAuthAppsPage dehydratedState={undefined} />
    </OrganizationSettingsLayout>
  )
}
