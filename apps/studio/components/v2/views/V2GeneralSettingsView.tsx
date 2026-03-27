'use client'

import { IS_PLATFORM } from 'common'
import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { ComplianceConfig } from 'components/interfaces/Settings/General/ComplianceConfig/ProjectComplianceMode'
import { CustomDomainConfig } from 'components/interfaces/Settings/General/CustomDomainConfig/CustomDomainConfig'
import { DeleteProjectPanel } from 'components/interfaces/Settings/General/DeleteProjectPanel/DeleteProjectPanel'
import { General } from 'components/interfaces/Settings/General/General'
import { TransferProjectPanel } from 'components/interfaces/Settings/General/TransferProjectPanel/TransferProjectPanel'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { Project } from '@/components/interfaces/Settings/General/Project'
import { StudioDataWorkspace } from '@/components/v2/data/StudioDataWorkspace'
import { useV2Params } from '@/app/v2/V2ParamsContext'

export function V2GeneralSettingsView() {
  const router = useRouter()
  const { projectRef } = useV2Params()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const isBranch = !!project?.parent_project_ref
  const { projectsTransfer: projectTransferEnabled, projectSettingsCustomDomains } =
    useIsFeatureEnabled(['projects:transfer', 'project_settings:custom_domains'])

  useEffect(() => {
    if (!IS_PLATFORM) {
      router.push('/project/default/settings/log-drains')
    }
  }, [router])

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrganization?.slug })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  return (
    <StudioDataWorkspace projectRef={projectRef}>
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
          <Project />
          {!isBranch && hasHipaaAddon && <ComplianceConfig />}
          {projectSettingsCustomDomains && <CustomDomainConfig />}
          {!isBranch && projectTransferEnabled && <TransferProjectPanel />}
          {!isBranch && <DeleteProjectPanel />}
        </PageContainer>
      </>
    </StudioDataWorkspace>
  )
}
