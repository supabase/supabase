import { PermissionAction } from '@supabase/shared-types/out/constants'

import { AuthProvidersForm, BasicAuthSettingsForm } from 'components/interfaces/Auth'
import { AuthProvidersLayout } from 'components/layouts/AuthLayout/AuthProvidersLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const ProvidersPage: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth provider settings" />
  }

  return (
    <ScaffoldContainer>
      <BasicAuthSettingsForm />
      <AuthProvidersForm />
    </ScaffoldContainer>
  )
}

ProvidersPage.getLayout = (page) => <AuthProvidersLayout>{page}</AuthProvidersLayout>

export default ProvidersPage
