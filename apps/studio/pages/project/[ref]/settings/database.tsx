import {
  ConnectionPooling,
  DatabaseSettings,
  NetworkRestrictions,
} from 'components/interfaces/Settings/Database'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from 'types'

import { DiskManagementPanelForm } from 'components/interfaces/DiskManagement/DiskManagementPanelForm'
import BannedIPs from 'components/interfaces/Settings/Database/BannedIPs'
import { DatabaseReadOnlyAlert } from 'components/interfaces/Settings/Database/DatabaseReadOnlyAlert'
import { DatabaseConnectionString } from 'components/interfaces/Settings/Database/DatabaseSettings/DatabaseConnectionString'
import { PoolingModesModal } from 'components/interfaces/Settings/Database/PoolingModesModal'
import SSLConfiguration from 'components/interfaces/Settings/Database/SSLConfiguration'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import DiskSizeConfiguration from 'components/interfaces/Settings/Database/DiskSizeConfiguration'
import { useFlag } from 'hooks/ui/useFlag'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'

const ProjectSettings: NextPageWithLayout = () => {
  const diskManagementV2 = useFlag('diskManagementV2')
  const showDiskAndComputeForm = useFlag('diskAndComputeForm')
  const project = useSelectedProject()

  const showNewDiskManagementUI = diskManagementV2 && project?.cloud_provider === 'AWS'

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
            <DatabaseConnectionString appearance="default" />
            <DatabaseSettings />
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
