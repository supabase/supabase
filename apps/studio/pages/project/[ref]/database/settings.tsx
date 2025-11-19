import { DiskManagementPanelForm } from 'components/interfaces/DiskManagement/DiskManagementPanelForm'
import BannedIPs from 'components/interfaces/Settings/Database/BannedIPs'
import { ConnectionPooling } from 'components/interfaces/Settings/Database/ConnectionPooling/ConnectionPooling'
import { DatabaseReadOnlyAlert } from 'components/interfaces/Settings/Database/DatabaseReadOnlyAlert'
import ResetDbPassword from 'components/interfaces/Settings/Database/DatabaseSettings/ResetDbPassword'
import DiskSizeConfiguration from 'components/interfaces/Settings/Database/DiskSizeConfiguration'
import { NetworkRestrictions } from 'components/interfaces/Settings/Database/NetworkRestrictions/NetworkRestrictions'
import { PoolingModesModal } from 'components/interfaces/Settings/Database/PoolingModesModal'
import SSLConfiguration from 'components/interfaces/Settings/Database/SSLConfiguration'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useIsAwsCloudProvider, useIsAwsK8sCloudProvider } from 'hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const ProjectSettings: NextPageWithLayout = () => {
  const isAws = useIsAwsCloudProvider()
  const isAwsK8s = useIsAwsK8sCloudProvider()

  const showNewDiskManagementUI = isAws || isAwsK8s

  const { databaseNetworkRestrictions } = useIsFeatureEnabled(['database:network_restrictions'])

  return (
    <>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Database Settings</PageHeaderTitle>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer>
        <PageSection>
          <PageSectionContent>
            <div className="space-y-10">
              <div className="flex flex-col gap-y-10">
                <DatabaseReadOnlyAlert />
                <ResetDbPassword />
                <ConnectionPooling />
              </div>

              <SSLConfiguration />
              {showNewDiskManagementUI ? (
                // This form is hidden if Disk and Compute form is enabled, new form is on ./settings/compute-and-disk
                <DiskManagementPanelForm />
              ) : (
                <DiskSizeConfiguration />
              )}
              {databaseNetworkRestrictions && <NetworkRestrictions />}
              <BannedIPs />
            </div>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
      <PoolingModesModal />
    </>
  )
}

ProjectSettings.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default ProjectSettings
