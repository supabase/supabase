import { DiskManagementPanelForm } from 'components/interfaces/DiskManagement/DiskManagementPanelForm'
import { ConnectionPooling, NetworkRestrictions } from 'components/interfaces/Settings/Database'
import BannedIPs from 'components/interfaces/Settings/Database/BannedIPs'
import { ConnectionStringMoved } from 'components/interfaces/Settings/Database/ConnectionStringMoved'
import { DatabaseReadOnlyAlert } from 'components/interfaces/Settings/Database/DatabaseReadOnlyAlert'
import ResetDbPassword from 'components/interfaces/Settings/Database/DatabaseSettings/ResetDbPassword'
import DiskSizeConfiguration from 'components/interfaces/Settings/Database/DiskSizeConfiguration'
import { PoolingModesModal } from 'components/interfaces/Settings/Database/PoolingModesModal'
import SSLConfiguration from 'components/interfaces/Settings/Database/SSLConfiguration'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from 'types'

const ProjectSettings: NextPageWithLayout = () => {
  const project = useSelectedProject()
  const showNewDiskManagementUI = project?.cloud_provider === 'AWS'

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Database Settings</ScaffoldTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer bottomPadding>
        <div className="space-y-10">
          <div className="flex flex-col gap-y-10">
            <DatabaseReadOnlyAlert />
            <ConnectionStringMoved />
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
          <NetworkRestrictions />
          <BannedIPs />
        </div>
      </ScaffoldContainer>
      <PoolingModesModal />
    </>
  )
}

ProjectSettings.getLayout = (page) => <SettingsLayout title="Database">{page}</SettingsLayout>

export default ProjectSettings
