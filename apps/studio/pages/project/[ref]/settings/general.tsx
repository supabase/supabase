import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import {
  ComplianceConfig,
  CustomDomainConfig,
  DeleteProjectPanel,
  General,
  TransferProjectPanel,
} from 'components/interfaces/Settings/General'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import type { NextPageWithLayout } from 'types'

const ProjectSettings: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const selectedOrganization = useSelectedOrganization()

  const isBranch = !!project?.parent_project_ref
  const { projectsTransfer: projectTransferEnabled } = useIsFeatureEnabled(['projects:transfer'])

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
        {!isBranch ? (
          <>
            {/* this is only setable on compliance orgs, currently that means HIPAA orgs */}
            {hasHipaaAddon && <ComplianceConfig />}
            <CustomDomainConfig />
            {projectTransferEnabled && <TransferProjectPanel />}
            <DeleteProjectPanel />
          </>
        ) : null}
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
