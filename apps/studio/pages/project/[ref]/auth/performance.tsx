import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { PerformanceSettingsForm } from 'components/interfaces/Auth/PerformanceSettingsForm'
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

const PerformancePage: NextPageWithLayout = () => {
  const { ref } = useParams()

  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

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
        <PerformanceSettingsForm />
      )}
    </ScaffoldContainer>
  )
}

PerformancePage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="Performance tuning"
        subtitle="Adjust low-level Auth settings for increased performance in certain situations"
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default PerformancePage
