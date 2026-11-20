import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { SecuritySettings } from '@/components/interfaces/Organization/SecuritySettings'
import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const Route = createFileRoute('/_app/org/$slug/security')({
  component: OrgSecurity,
  staticData: {
    orgLayoutTitle: 'Security',
  },
})

function OrgSecurity() {
  return (
    <OrganizationSettingsLayout>
      <OrgSecuritySettingsPage />
    </OrganizationSettingsLayout>
  )
}

function OrgSecuritySettingsPage() {
  const { slug } = useParams()
  const showSecuritySettings = useIsFeatureEnabled('organization:show_security_settings')

  if (!showSecuritySettings) {
    return <UnknownInterface urlBack={`/org/${slug}`} />
  }

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Security</PageHeaderTitle>
            <PageHeaderDescription>
              Organization-wide security controls and MFA enforcement
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <SecuritySettings />
    </>
  )
}
