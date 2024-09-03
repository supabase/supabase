import {
  ConnectionPooling,
  DatabaseSettings,
  NetworkRestrictions,
} from 'components/interfaces/Settings/Database'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from 'types'

import { DiskMangementPanelForm } from 'components/interfaces/DiskManagement/DiskMangementPanelForm'
import BannedIPs from 'components/interfaces/Settings/Database/BannedIPs'
import { DatabaseReadOnlyAlert } from 'components/interfaces/Settings/Database/DatabaseReadOnlyAlert'
import { DatabaseConnectionString } from 'components/interfaces/Settings/Database/DatabaseSettings/DatabaseConnectionString'
import { PoolingModesModal } from 'components/interfaces/Settings/Database/PoolingModesModal'
import SSLConfiguration from 'components/interfaces/Settings/Database/SSLConfiguration'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'

const ProjectSettings: NextPageWithLayout = () => {
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
          <DiskMangementPanelForm />
          {/* <DiskSizeConfiguration /> */}
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
