import { IntegrationSettings } from 'components/interfaces/Organization'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import type { NextPageWithLayout } from 'types'

const OrgIntegrationSettings: NextPageWithLayout = () => {
  return <IntegrationSettings />
}

OrgIntegrationSettings.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>{page}</OrganizationLayout>
  </DefaultLayout>
)

export default OrgIntegrationSettings
