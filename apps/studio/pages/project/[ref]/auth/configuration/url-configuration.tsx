import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ReactNode } from 'react'

import { useParams } from 'common'
import { RedirectUrls } from 'components/interfaces/Auth/RedirectUrls/RedirectUrls'
import SiteUrl from 'components/interfaces/Auth/SiteUrl/SiteUrl'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

interface URLConfigurationLayoutProps {
  children: ReactNode
}

export const URLConfigurationLayout = ({ children }: URLConfigurationLayoutProps) => {
  const { ref } = useParams()

  return (
    <DefaultLayout>
      <AuthLayout>
        <PageLayout
          title="URL Configuration"
          subtitle="Configure site URL and redirect URLs for authentication"
        >
          {children}
        </PageLayout>
      </AuthLayout>
    </DefaultLayout>
  )
}

const URLConfiguration: NextPageWithLayout = () => {
  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's authentication settings" />
  }

  return (
    <ScaffoldContainer>
      {!isPermissionsLoaded ? (
        <div className="mt-12">
          <GenericSkeletonLoader />
        </div>
      ) : (
        <>
          <SiteUrl />
          <RedirectUrls />
        </>
      )}
    </ScaffoldContainer>
  )
}

URLConfiguration.getLayout = (page) => <URLConfigurationLayout>{page}</URLConfigurationLayout>

export default URLConfiguration
