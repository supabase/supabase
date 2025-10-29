import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { ProtectionAuthSettingsForm } from 'components/interfaces/Auth/ProtectionAuthSettingsForm/ProtectionAuthSettingsForm'
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

const ProtectionPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const showAttackProtection = useIsFeatureEnabled('authentication:attack_protection')

  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  if (!showAttackProtection) {
    return <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
  }

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth provider settings" />
  }

  return (
    <ScaffoldContainer>
      {!isPermissionsLoaded ? (
        <ScaffoldSection isFullWidth>
          <GenericSkeletonLoader />
        </ScaffoldSection>
      ) : (
        <ProtectionAuthSettingsForm />
      )}
    </ScaffoldContainer>
  )
}

ProtectionPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="Attack Protection"
        subtitle="Configure security settings to protect your project from attacks"
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default ProtectionPage
