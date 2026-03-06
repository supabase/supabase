import { IS_PLATFORM } from 'common'
import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { ComplianceConfig } from 'components/interfaces/Settings/General/ComplianceConfig/ProjectComplianceMode'
import { CustomDomainConfig } from 'components/interfaces/Settings/General/CustomDomainConfig/CustomDomainConfig'
import { DeleteProjectPanel } from 'components/interfaces/Settings/General/DeleteProjectPanel/DeleteProjectPanel'
import { General } from 'components/interfaces/Settings/General/General'
import { TransferProjectPanel } from 'components/interfaces/Settings/General/TransferProjectPanel/TransferProjectPanel'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

const ProjectSettings: NextPageWithLayout = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const isBranch = !!project?.parent_project_ref
  const { projectsTransfer: projectTransferEnabled, projectSettingsCustomDomains } =
    useIsFeatureEnabled(['projects:transfer', 'project_settings:custom_domains'])
  const router = useRouter()

  useEffect(() => {
    if (!IS_PLATFORM) {
      router.push(`/project/default/settings/log-drains`)
    }
  }, [router])

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrganization?.slug })
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

        {/* this is only settable on compliance orgs, currently that means HIPAA orgs */}
        {!isBranch && hasHipaaAddon && <ComplianceConfig />}
        {projectSettingsCustomDomains && <CustomDomainConfig />}
        {!isBranch && projectTransferEnabled && <TransferProjectPanel />}
        {!isBranch && <DeleteProjectPanel />}
      </PageContainer>
    </>
  )
}

ProjectSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="General">{page}</SettingsLayout>
  </DefaultLayout>
)
export default ProjectSettings
