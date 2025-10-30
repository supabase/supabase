import { useParams } from 'common'
import { SecuritySettings } from 'components/interfaces/Organization/SecuritySettings/SecuritySettings'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const OrgSecuritySettings: NextPageWithLayout = () => {
  const { slug } = useParams()
  const showSecuritySettings = useIsFeatureEnabled('organization:show_security_settings')

  if (!showSecuritySettings) {
    return <UnknownInterface urlBack={`/org/${slug}`} />
  }

  return <SecuritySettings />
}

OrgSecuritySettings.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)
export default OrgSecuritySettings
