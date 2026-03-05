import { useRouter } from 'next/router'
import { InstallationDetails } from 'components/interfaces/Organization/PrivateApps/InstallationDetails'
import { PrivateAppsProvider, usePrivateApps } from 'components/interfaces/Organization/PrivateApps/PrivateAppsContext'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import type { NextPageWithLayout } from 'types'
import {
  PageHeader,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

function InstallationDetailsContent() {
  const router = useRouter()
  const { installationId } = router.query as { installationId: string }
  const { installations } = usePrivateApps()

  const installation = installations.find((i) => i.id === installationId)

  if (!installation) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-foreground-light">Installation not found</p>
        <p className="text-sm text-foreground-muted">
          This installation may have been removed or the link is invalid.
        </p>
      </div>
    )
  }

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{installation.appName}</PageHeaderTitle>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <InstallationDetails installation={installation} />
    </>
  )
}

const InstallationDetailsPage: NextPageWithLayout = () => {
  return <InstallationDetailsContent />
}

InstallationDetailsPage.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout pageTitle="App Installations">
        <PrivateAppsProvider>{page}</PrivateAppsProvider>
      </OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default InstallationDetailsPage
