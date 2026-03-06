import { useParams } from 'common'
import { SecuritySettings } from 'components/interfaces/Organization/SecuritySettings'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

const OrgSecuritySettings: NextPageWithLayout = () => {
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

OrgSecuritySettings.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout pageTitle="Security">{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)
export default OrgSecuritySettings
