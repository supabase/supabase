import { OAuthApps } from 'components/interfaces/Organization/OAuthApps/OAuthApps'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import type { NextPageWithLayout } from 'types'

const OrgOAuthApps: NextPageWithLayout = () => {
  return <OAuthApps />
}

OrgOAuthApps.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)
export default OrgOAuthApps
