import { IntegrationSettings } from 'components/interfaces/Organization'
import OrganizationLayout from 'app/(org)/org/layout'
import type { NextPageWithLayout } from 'types'

const OrgIntegrationSettings: NextPageWithLayout = () => {
  return <IntegrationSettings />
}

OrgIntegrationSettings.getLayout = (page) => (
  <OrganizationLayout pagesRouter>{page}</OrganizationLayout>
)

export default OrgIntegrationSettings
