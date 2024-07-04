import { PermissionAction } from '@supabase/shared-types/out/constants'

import RedirectUrls from 'components/interfaces/Auth/RedirectUrls/RedirectUrls'
import SiteUrl from 'components/interfaces/Auth/SiteUrl/SiteUrl'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import { FormsContainer } from 'components/ui/Forms/FormsContainer'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const URLConfiguration: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  } else {
    return (
      <FormsContainer>
        <SiteUrl />
        <RedirectUrls />
      </FormsContainer>
    )
  }
}

URLConfiguration.getLayout = (page) => {
  return <AuthLayout>{page}</AuthLayout>
}

export default URLConfiguration
