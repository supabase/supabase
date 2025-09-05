import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import {
  DatabaseSettings,
  ConnectionPooling,
  SSLConfiguration,
  DiskSizeConfiguration,
  NetworkRestrictions,
  BannedIPs,
  PoolingModesModal,
} from 'components/interfaces/Settings/Database'
import { DiskManagementPanelForm } from 'components/interfaces/DiskManagement/DiskManagementPanelForm'
import { useIsAwsCloudProvider, useIsAwsK8sCloudProvider } from 'hooks/misc/useSelectedProject'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'

const ProjectSettings: NextPageWithLayout = () => {
  const isAws = useIsAwsCloudProvider()
  const isAwsK8s = useIsAwsK8sCloudProvider()

  const showNewDiskManagementUI = isAws || isAwsK8s

  return (
    <ScaffoldContainer bottomPadding>
      <ScaffoldHeader>
        <ScaffoldTitle>Database Settings</ScaffoldTitle>
      </ScaffoldHeader>

      <DatabaseSettings />

      <ConnectionPooling />

      <SSLConfiguration />

      {showNewDiskManagementUI ? (
        // This form is hidden if Disk and Compute form is enabled, new form is on ./settings/compute-and-disk
        <DiskManagementPanelForm />
      ) : (
        <DiskSizeConfiguration />
      )}

      <NetworkRestrictions />

      <BannedIPs />

      <PoolingModesModal />
    </ScaffoldContainer>
  )
}

ProjectSettings.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default ProjectSettings
