import { createFileRoute } from '@tanstack/react-router'

import { PlatformWebhooksPage } from '@/components/interfaces/Platform/Webhooks'
import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'

export const Route = createFileRoute('/_app/org/$slug/webhooks/')({
  component: OrgWebhooks,
  staticData: {
    orgLayoutTitle: 'Webhooks',
  },
})

function OrgWebhooks() {
  return (
    <OrganizationSettingsLayout>
      <OrgWebhooksSettingsPage />
    </OrganizationSettingsLayout>
  )
}

function OrgWebhooksSettingsPage() {
  return <PlatformWebhooksPage scope="organization" />
}
