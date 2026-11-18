import { createFileRoute } from '@tanstack/react-router'
import { LogoLoader } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { GeneralSettings } from '@/components/interfaces/Organization/GeneralSettings/GeneralSettings'
import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { usePermissionsQuery } from '@/data/permissions/permissions-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export const Route = createFileRoute('/_app/org/$slug/general')({
  component: OrgGeneral,
  staticData: {
    orgLayoutTitle: 'General',
  },
})

function OrgGeneral() {
  return (
    <OrganizationSettingsLayout>
      <OrgGeneralSettingsPage />
    </OrganizationSettingsLayout>
  )
}

function OrgGeneralSettingsPage() {
  const { isPending: isLoadingPermissions } = usePermissionsQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Organization Settings</PageHeaderTitle>
            <PageHeaderDescription>
              General configuration, privacy, and lifecycle controls
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default">
        {selectedOrganization === undefined && isLoadingPermissions ? (
          <LogoLoader />
        ) : (
          <GeneralSettings />
        )}
      </PageContainer>
    </>
  )
}
