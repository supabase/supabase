import { DiskManagementPanelForm } from 'components/interfaces/DiskManagement/DiskManagementPanelForm'
import { ConnectionPooling } from 'components/interfaces/Settings/Database/ConnectionPooling/ConnectionPooling'
import { DatabaseReadOnlyAlert } from 'components/interfaces/Settings/Database/DatabaseReadOnlyAlert'
import { PoolingModesModal } from 'components/interfaces/Settings/Database/PoolingModesModal'
import { NetworkRestrictions } from 'components/interfaces/Settings/Database/NetworkRestrictions/NetworkRestrictions'
import BannedIPs from 'components/interfaces/Settings/Database/BannedIPs'
import ResetDbPassword from 'components/interfaces/Settings/Database/DatabaseSettings/ResetDbPassword'
import DiskSizeConfiguration from 'components/interfaces/Settings/Database/DiskSizeConfiguration'
import SSLConfiguration from 'components/interfaces/Settings/Database/SSLConfiguration'

import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useIsAwsCloudProvider, useIsAwsK8sCloudProvider } from 'hooks/misc/useSelectedProject'

export function SettingsDatabase() {
  const isAws = useIsAwsCloudProvider()
  const isAwsK8s = useIsAwsK8sCloudProvider()

  const showNewDiskManagementUI = isAws || isAwsK8s

  const { databaseNetworkRestrictions } = useIsFeatureEnabled(['database:network_restrictions'])

  return (
    <>
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

      <PoolingModesModal />
    </>
  )
}
