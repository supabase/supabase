import { useRouter } from 'next/router'
import { AppDetails } from 'components/interfaces/Organization/PrivateApps/AppDetails'
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

function AppDetailsContent() {
  const router = useRouter()
  const { appId } = router.query as { appId: string }
  const { apps } = usePrivateApps()

  const app = apps.find((a) => a.id === appId)

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-foreground-light">App not found</p>
        <p className="text-sm text-foreground-muted">
          This app may have been deleted or the link is invalid.
        </p>
      </div>
    )
  }

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{app.name}</PageHeaderTitle>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <AppDetails app={app} />
    </>
  )
}

const AppDetailsPage: NextPageWithLayout = () => {
  return <AppDetailsContent />
}

AppDetailsPage.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout pageTitle="Private Apps">
        <PrivateAppsProvider>{page}</PrivateAppsProvider>
      </OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default AppDetailsPage
