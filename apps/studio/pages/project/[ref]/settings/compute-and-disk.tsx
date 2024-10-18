import { DiskManagementForm } from 'components/interfaces/DiskManagement/DiskManagementForm'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'

const AuthSettings: NextPageWithLayout = () => {
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
          <ScaffoldTitle>Compute and Disk</ScaffoldTitle>
          <ScaffoldDescription>Configure security and user session settings</ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
        {/* {showNewDiskManagementUI ? <DiskManagementForm /> : null} */}
        <DiskManagementForm />
      </ScaffoldContainer>
    </>
  )
}

AuthSettings.getLayout = (page) => <SettingsLayout>{page}</SettingsLayout>
export default AuthSettings
