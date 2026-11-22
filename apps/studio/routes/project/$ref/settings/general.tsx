import { createFileRoute } from '@tanstack/react-router'
import { IS_PLATFORM } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { subscriptionHasHipaaAddon } from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import { ComplianceConfig } from '@/components/interfaces/Settings/General/ComplianceConfig/ProjectComplianceMode'
import { CustomDomainConfig } from '@/components/interfaces/Settings/General/CustomDomainConfig/CustomDomainConfig'
import { DeleteBranchPanel } from '@/components/interfaces/Settings/General/DeleteBranchPanel'
import { DeleteProjectPanel } from '@/components/interfaces/Settings/General/DeleteProjectPanel/DeleteProjectPanel'
import { General } from '@/components/interfaces/Settings/General/General'
import { Project } from '@/components/interfaces/Settings/General/Project'
import { ServiceVersionsSection } from '@/components/interfaces/Settings/General/ServiceVersions/ServiceVersionsSection'
import { TransferProjectPanel } from '@/components/interfaces/Settings/General/TransferProjectPanel/TransferProjectPanel'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const Route = createFileRoute('/project/$ref/settings/general')({
  component: ProjectSettings,
  staticData: { settingsLayoutTitle: 'General' },
})

function ProjectSettings() {
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const isBranch = !!project?.parent_project_ref
  const { projectsTransfer: projectTransferEnabled, projectSettingsCustomDomains } =
    useIsFeatureEnabled(['projects:transfer', 'project_settings:custom_domains'])

  const { data: subscription } = useOrgSubscriptionQuery(
    { orgSlug: selectedOrganization?.slug },
    { enabled: IS_PLATFORM }
  )
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Project Settings</PageHeaderTitle>
            <PageHeaderDescription>
              General configuration, domains, ownership, and lifecycle
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="small">
        <General />
        {IS_PLATFORM && (
          <>
            <Project />
            <ServiceVersionsSection />
            {/* this is only settable on compliance orgs, currently that means HIPAA orgs */}
            {!isBranch && hasHipaaAddon && <ComplianceConfig />}
            {projectSettingsCustomDomains && <CustomDomainConfig />}
            {!isBranch && projectTransferEnabled && <TransferProjectPanel />}
            {isBranch ? <DeleteBranchPanel /> : <DeleteProjectPanel />}
          </>
        )}
      </PageContainer>
    </>
  )
}
