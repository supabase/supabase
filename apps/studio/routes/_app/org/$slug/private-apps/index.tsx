import { createFileRoute } from '@tanstack/react-router'

import { PrivateAppsProvider } from '@/components/interfaces/Organization/PrivateApps/PrivateAppsContext'
import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import PrivateAppsPage from '@/pages/org/[slug]/private-apps/index'

export const Route = createFileRoute('/_app/org/$slug/private-apps/')({
  component: OrgPrivateApps,
  staticData: {
    orgLayoutTitle: 'Private Apps',
  },
})

function OrgPrivateApps() {
  return (
    <OrganizationSettingsLayout>
      <PrivateAppsProvider>
        <PrivateAppsPage dehydratedState={undefined} />
      </PrivateAppsProvider>
    </OrganizationSettingsLayout>
  )
}
