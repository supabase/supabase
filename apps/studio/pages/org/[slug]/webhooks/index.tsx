import { PlatformWebhooksPage } from 'components/interfaces/Platform/Webhooks'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import type { NextPageWithLayout } from 'types'

const OrgWebhooksSettings: NextPageWithLayout = () => {
  return <PlatformWebhooksPage scope="organization" />
}

OrgWebhooksSettings.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default OrgWebhooksSettings
