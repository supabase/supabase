import { AppsList } from 'components/interfaces/Organization/PrivateApps/AppsList'
import { InstallationsList } from 'components/interfaces/Organization/PrivateApps/InstallationsList'
import { PrivateAppsProvider } from 'components/interfaces/Organization/PrivateApps/PrivateAppsContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
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

const PrivateAppsPage: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Private Apps</PageHeaderTitle>
            <PageHeaderDescription>
              Create private apps to generate scoped access tokens for your organization
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <ScaffoldContainer className="px-6 xl:px-10">
        <ScaffoldSection isFullWidth className="flex flex-col gap-y-12 pb-16">
          <div className="flex flex-col gap-y-3">
            <div>
              <p className="font-medium">Apps</p>
              <p className="text-sm text-foreground-light">
                Registered private apps and their credentials
              </p>
            </div>
            <AppsList />
          </div>

          <div className="flex flex-col gap-y-3">
            <div>
              <p className="font-medium">Installations</p>
              <p className="text-sm text-foreground-light">
                Where apps are installed across your organization's projects
              </p>
            </div>
            <InstallationsList />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}

PrivateAppsPage.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout pageTitle="Private Apps">
        <PrivateAppsProvider>{page}</PrivateAppsProvider>
      </OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default PrivateAppsPage
