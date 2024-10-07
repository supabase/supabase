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
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'

const ProjectSettings: NextPageWithLayout = () => {
  const diskManagementV2 = useFlag('diskManagementV2')
  const project = useSelectedProject()
  const selectedOrg = useSelectedOrganization()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrg?.slug })

  const showNewDiskManagementUI =
    diskManagementV2 &&
    project?.cloud_provider === 'AWS' &&
    subscription?.usage_based_billing_project_addons

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
          {showNewDiskManagementUI ? <DiskManagementPanelForm /> : <DiskSizeConfiguration />}
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
