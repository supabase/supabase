import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { MfaAuthSettingsForm } from 'components/interfaces/Auth/MfaAuthSettingsForm/MfaAuthSettingsForm'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const MfaPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const showMFA = useIsFeatureEnabled('authentication:multi_factor')

  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  if (!showMFA) {
    return <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
  }

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's authentication settings" />
  }

  return (
    <ScaffoldContainer>
      {!isPermissionsLoaded ? (
        <ScaffoldSection isFullWidth>
          <GenericSkeletonLoader />
        </ScaffoldSection>
      ) : (
        <MfaAuthSettingsForm />
      )}
    </ScaffoldContainer>
  )
}

MfaPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="Multi-Factor Authentication (MFA)"
        subtitle="Requires users to provide additional verification factors to authenticate"
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default MfaPage
