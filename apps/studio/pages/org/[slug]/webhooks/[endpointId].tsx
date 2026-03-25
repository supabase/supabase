import { PlatformWebhooksPage } from 'components/interfaces/Platform/Webhooks'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { useRouter } from 'next/router'
import type { NextPageWithLayout } from 'types'

const OrgWebhookEndpointSettings: NextPageWithLayout = () => {
  const { query } = useRouter()
  const endpointId = Array.isArray(query.endpointId) ? query.endpointId[0] : query.endpointId

  return <PlatformWebhooksPage scope="organization" endpointId={endpointId} />
}

OrgWebhookEndpointSettings.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="Webhooks">
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default OrgWebhookEndpointSettings
