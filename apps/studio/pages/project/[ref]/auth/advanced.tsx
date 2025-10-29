import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { AdvancedAuthSettingsForm } from 'components/interfaces/Auth/AdvancedAuthSettingsForm'
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

const AdvancedPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const showAdvanced = useIsFeatureEnabled('authentication:advanced')

  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  if (!showAdvanced) {
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
        <AdvancedAuthSettingsForm />
      )}
    </ScaffoldContainer>
  )
}

AdvancedPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout title="Advanced" subtitle="Configure advanced authentication server settings">
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default AdvancedPage
