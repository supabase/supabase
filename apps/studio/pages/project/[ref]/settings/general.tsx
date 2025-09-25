import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import {
  ComplianceConfig,
  CustomDomainConfig,
  General,
  TransferProjectPanel,
} from 'components/interfaces/Settings/General'
import { DeleteProjectPanel } from 'components/interfaces/Settings/General/DeleteProjectPanel/DeleteProjectPanel'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from 'types'

const ProjectSettings: NextPageWithLayout = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const isBranch = !!project?.parent_project_ref
  const { projectsTransfer: projectTransferEnabled, projectSettingsCustomDomains } =
    useIsFeatureEnabled(['projects:transfer', 'project_settings:custom_domains'])

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrganization?.slug })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Project Settings</ScaffoldTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
        <General />

        {/* this is only settable on compliance orgs, currently that means HIPAA orgs */}
        {!isBranch && hasHipaaAddon && <ComplianceConfig />}
        {projectSettingsCustomDomains && <CustomDomainConfig />}
        {!isBranch && projectTransferEnabled && <TransferProjectPanel />}
        {!isBranch && <DeleteProjectPanel />}
      </ScaffoldContainer>
    </>
  )
}

ProjectSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="General">{page}</SettingsLayout>
  </DefaultLayout>
)
export default ProjectSettings
