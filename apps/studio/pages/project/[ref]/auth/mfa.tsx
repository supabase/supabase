import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { MfaAuthSettingsForm } from 'components/interfaces/Auth'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const MfaPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const showMFA = useIsFeatureEnabled('authentication:multi_factor')

  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (!showMFA) {
    return <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
  }

  return (
    <PageLayout
      title="Multi-Factor Authentication (MFA)"
      subtitle="Requires users to provide additional verification factors to authenticate"
    >
      {isPermissionsLoaded && !canReadAuthSettings ? (
        <NoPermission isFullPage resourceText="access your project's authentication settings" />
      ) : (
        <ScaffoldContainer>
          {!isPermissionsLoaded ? (
            <ScaffoldSection isFullWidth>
              <GenericSkeletonLoader />
            </ScaffoldSection>
          ) : (
            <MfaAuthSettingsForm />
          )}
        </ScaffoldContainer>
      )}
    </PageLayout>
  )
}

MfaPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default MfaPage
