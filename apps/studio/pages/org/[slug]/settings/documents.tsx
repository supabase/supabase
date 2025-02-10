import { Documents } from 'components/interfaces/Organization'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/organization-settings-layout'
import type { NextPageWithLayout } from 'types'

const OrgDocuments: NextPageWithLayout = () => {
  return <Documents />
}

OrgDocuments.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout>
      <OrganizationLayout>
        <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
      </OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default OrgDocuments
