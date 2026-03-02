import dynamic from 'next/dynamic'
import { IS_PLATFORM } from 'lib/constants'
import { ConnectionPooling } from 'components/interfaces/Settings/Database/ConnectionPooling/ConnectionPooling'
import { DatabaseReadOnlyAlert } from 'components/interfaces/Settings/Database/DatabaseReadOnlyAlert'
import ResetDbPassword from 'components/interfaces/Settings/Database/DatabaseSettings/ResetDbPassword'
import { PoolingModesModal } from 'components/interfaces/Settings/Database/PoolingModesModal'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useIsAwsCloudProvider, useIsAwsK8sCloudProvider } from 'hooks/misc/useSelectedProject'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import type { NextPageWithLayout } from 'types'
import { SettingsDatabaseEmptyStateLocal } from 'components/interfaces/Settings/Database/SettingsDatabaseEmptyStateLocal'

const SSLConfiguration = dynamic(
  () => import('components/interfaces/Settings/Database/SSLConfiguration')
)
const DiskSizeConfiguration = dynamic(
  () => import('components/interfaces/Settings/Database/DiskSizeConfiguration')
)
const NetworkRestrictions = dynamic(() =>
  import('components/interfaces/Settings/Database/NetworkRestrictions/NetworkRestrictions').then(
    (mod) => mod.NetworkRestrictions
  )
)
const BannedIPs = dynamic(() => import('components/interfaces/Settings/Database/BannedIPs'))
const DiskManagementPanelForm = dynamic(() =>
  import('components/interfaces/DiskManagement/DiskManagementPanelForm').then(
    (mod) => mod.DiskManagementPanelForm
  )
)

const ProjectSettings: NextPageWithLayout = () => {
  const isAws = useIsAwsCloudProvider()
  const isAwsK8s = useIsAwsK8sCloudProvider()
  const showNewDiskManagementUI = isAws || isAwsK8s
  const { databaseNetworkRestrictions } = useIsFeatureEnabled(['database:network_restrictions'])

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Database Settings</PageHeaderTitle>
            <PageHeaderDescription>
              Connections, security, and network configuration
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      {IS_PLATFORM ? (
        <>
          <PageContainer size="small" className="flex flex-col gap-8 pb-12">
            <DatabaseReadOnlyAlert />
            <ResetDbPassword />
            <ConnectionPooling />
            <SSLConfiguration />
            {showNewDiskManagementUI ? (
              // This form is hidden if Disk and Compute form is enabled, new form is on ./settings/compute-and-disk
              <DiskManagementPanelForm />
            ) : (
              <DiskSizeConfiguration />
            )}
            {databaseNetworkRestrictions && <NetworkRestrictions />}
            <BannedIPs />
          </PageContainer>
          <PoolingModesModal />
        </>
      ) : (
        <PageContainer size="small" className="pb-12">
          <PageSection>
            <PageSectionContent className="space-y-4 md:space-y-8">
              <SettingsDatabaseEmptyStateLocal />
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      )}
    </>
  )
}

ProjectSettings.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default ProjectSettings
