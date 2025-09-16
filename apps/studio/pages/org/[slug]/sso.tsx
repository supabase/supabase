import { useParams } from 'common'
import { SSOConfig } from 'components/interfaces/Organization/SSO/SSOConfig'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const OrgSSO: NextPageWithLayout = () => {
  const { slug } = useParams()
  const showSsoSettings = useIsFeatureEnabled('organization:show_sso_settings')

  if (!showSsoSettings) {
    return <UnknownInterface urlBack={`/org/${slug}/general`} />
  }

  return <SSOConfig />
}

OrgSSO.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default OrgSSO
