import { PermissionAction } from '@supabase/shared-types/out/constants'
import { RedirectUrls } from 'components/interfaces/Auth/RedirectUrls/RedirectUrls'
import SiteUrl from 'components/interfaces/Auth/SiteUrl/SiteUrl'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
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
  return (
    <AppLayout>
      <DefaultLayout>
        <AuthLayout>{page}</AuthLayout>
      </DefaultLayout>
    </AppLayout>
  )
}

export default URLConfiguration
