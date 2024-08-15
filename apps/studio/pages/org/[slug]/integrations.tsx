import { IntegrationSettings } from 'components/interfaces/Organization'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import type { NextPageWithLayout } from 'types'

const OrgIntegrationSettings: NextPageWithLayout = () => {
  return <IntegrationSettings />
}

OrgIntegrationSettings.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>

export default OrgIntegrationSettings
