import { createFileRoute } from '@tanstack/react-router'

import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import OrgWebhookEndpointSettingsPage from '@/pages/org/[slug]/webhooks/[endpointId]'

export const Route = createFileRoute('/_app/org/$slug/webhooks/$endpointId')({
  component: OrgWebhookEndpoint,
  staticData: {
    orgLayoutTitle: 'Webhooks',
  },
})

function OrgWebhookEndpoint() {
  return (
    <OrganizationSettingsLayout>
      <OrgWebhookEndpointSettingsPage dehydratedState={undefined} />
    </OrganizationSettingsLayout>
  )
}
