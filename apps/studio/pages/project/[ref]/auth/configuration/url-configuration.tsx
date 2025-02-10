import { PermissionAction } from '@supabase/shared-types/out/constants'

import { RedirectUrls } from 'components/interfaces/Auth/RedirectUrls/RedirectUrls'
import SiteUrl from 'components/interfaces/Auth/SiteUrl/SiteUrl'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import { FormsContainer } from 'components/ui/Forms/FormsContainer'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
const URLConfiguration: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  } else {
    return (
      <div>
        <ScaffoldHeader className="pb-0">
          <ScaffoldContainer id="auth-page-top">
            <ScaffoldTitle>URL Configuration</ScaffoldTitle>
          </ScaffoldContainer>
        </ScaffoldHeader>

        <ScaffoldContainer className="my-8 space-y-8">
          <SiteUrl />
          <RedirectUrls />
        </ScaffoldContainer>
      </div>
    )
  }
}

URLConfiguration.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default URLConfiguration
