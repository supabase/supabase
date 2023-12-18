import { PermissionAction } from '@supabase/shared-types/out/constants'

import RedirectUrls from 'components/interfaces/Auth/RedirectUrls/RedirectUrls'
import SiteUrl from 'components/interfaces/Auth/SiteUrl/SiteUrl'
import { AuthLayout } from 'components/layouts'
import { FormsContainer } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions } from 'hooks'
import { NextPageWithLayout } from 'types'

const URLConfiguration: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (!canReadAuthSettings) {
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
