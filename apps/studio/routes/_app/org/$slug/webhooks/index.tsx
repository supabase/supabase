import { createFileRoute } from '@tanstack/react-router'

import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import OrgWebhooksSettingsPage from '@/pages/org/[slug]/webhooks/index'

export const Route = createFileRoute('/_app/org/$slug/webhooks/')({
  component: OrgWebhooks,
  staticData: {
    orgLayoutTitle: 'Webhooks',
  },
})

function OrgWebhooks() {
  return (
    <OrganizationSettingsLayout>
      <OrgWebhooksSettingsPage dehydratedState={undefined} />
    </OrganizationSettingsLayout>
  )
}
