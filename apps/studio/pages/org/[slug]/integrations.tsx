import { IntegrationSettings } from 'components/interfaces/Organization'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import type { NextPageWithLayout } from 'types'

const OrgIntegrationSettings: NextPageWithLayout = () => {
  return <IntegrationSettings />
}

OrgIntegrationSettings.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout>
      <OrganizationLayout>{page}</OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default OrgIntegrationSettings
