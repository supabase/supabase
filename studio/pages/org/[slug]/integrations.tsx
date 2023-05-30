import { NextPageWithLayout } from 'types'
import { OrganizationLayout } from 'components/layouts'
// import { IntegrationSettings } from 'components/interfaces/Organization'

const OrgIntegrationSettings: NextPageWithLayout = () => {
  return (
    <div>howdy</div>
    // <IntegrationSettings />
  )
}

OrgIntegrationSettings.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>

export default OrgIntegrationSettings
