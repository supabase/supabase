import { createFileRoute } from '@tanstack/react-router'

import { PlatformWebhooksPage } from '@/components/interfaces/Platform/Webhooks'
import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'

export const Route = createFileRoute('/_app/org/$slug/webhooks/$endpointId')({
  component: OrgWebhookEndpoint,
  staticData: {
    orgLayoutTitle: 'Webhooks',
  },
})

function OrgWebhookEndpoint() {
  return (
    <OrganizationSettingsLayout>
      <OrgWebhookEndpointSettingsPage />
    </OrganizationSettingsLayout>
  )
}

function OrgWebhookEndpointSettingsPage() {
  const { endpointId } = Route.useParams()

  // The key resets the page state (such as delivery page cursors) when the endpoint changes
  return <PlatformWebhooksPage key={endpointId} scope="organization" endpointId={endpointId} />
}
