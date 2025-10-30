import { PermissionAction } from '@supabase/shared-types/out/constants'

import { RedirectUrls } from 'components/interfaces/Auth/RedirectUrls/RedirectUrls'
import SiteUrl from 'components/interfaces/Auth/SiteUrl/SiteUrl'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const URLConfiguration: NextPageWithLayout = () => {
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
        <>
          <SiteUrl />
          <RedirectUrls />
        </>
      )}
    </ScaffoldContainer>
  )
}

URLConfiguration.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="URL Configuration"
        subtitle="Configure site URL and redirect URLs for authentication"
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default URLConfiguration
