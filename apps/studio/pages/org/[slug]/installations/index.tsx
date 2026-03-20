import { InstallationsList } from 'components/interfaces/Organization/PrivateApps/Installations/InstallationsList'
import { PrivateAppsProvider } from 'components/interfaces/Organization/PrivateApps/PrivateAppsContext'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import type { NextPageWithLayout } from 'types'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

const InstallationsPage: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>App Installations</PageHeaderTitle>
            <PageHeaderDescription>
              Manage where private apps are installed across your organization's projects
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <InstallationsList />
    </>
  )
}

InstallationsPage.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="App Installations">
      <OrganizationSettingsLayout>
        <PrivateAppsProvider>{page}</PrivateAppsProvider>
      </OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default InstallationsPage
