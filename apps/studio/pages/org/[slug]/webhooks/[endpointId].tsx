import { useRouter } from 'next/router'

import { PlatformWebhooksPage } from '@/components/interfaces/Platform/Webhooks'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import OrganizationLayout from '@/components/layouts/OrganizationLayout'
import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import type { NextPageWithLayout } from '@/types'

const OrgWebhookEndpointSettings: NextPageWithLayout = () => {
  const { query } = useRouter()
  const endpointId = Array.isArray(query.endpointId) ? query.endpointId[0] : query.endpointId

  // The key resets the page state (such as delivery page cursors) when the endpoint changes
  return <PlatformWebhooksPage key={endpointId} scope="organization" endpointId={endpointId} />
}

OrgWebhookEndpointSettings.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="Webhooks">
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default OrgWebhookEndpointSettings
