import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { SSOConfig } from '@/components/interfaces/Organization/SSO/SSOConfig'
import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const Route = createFileRoute('/_app/org/$slug/sso')({
  component: OrgSSO,
  staticData: {
    orgLayoutTitle: 'SSO',
  },
})

function OrgSSO() {
  return (
    <OrganizationSettingsLayout>
      <OrgSSOPage />
    </OrganizationSettingsLayout>
  )
}

function OrgSSOPage() {
  const { slug } = useParams()
  const showSsoSettings = useIsFeatureEnabled('organization:show_sso_settings')

  if (!showSsoSettings) {
    return <UnknownInterface urlBack={`/org/${slug}/general`} />
  }

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Single Sign-On</PageHeaderTitle>
            <PageHeaderDescription>
              SAML SSO configuration and domain access controls
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <SSOConfig />
    </>
  )
}
