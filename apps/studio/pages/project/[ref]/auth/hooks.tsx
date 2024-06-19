import { PermissionAction } from '@supabase/shared-types/out/constants'

import { HooksListing } from 'components/interfaces/Auth/Hooks/HooksListing'
import { AuthLayout } from 'components/layouts'
import { FormsContainer } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks'
import type { NextPageWithLayout } from 'types'

const Hooks: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth hooks" />
  } else {
    return (
      <FormsContainer>
        <HooksListing />
      </FormsContainer>
    )
  }
}

Hooks.getLayout = (page) => {
  return <AuthLayout>{page}</AuthLayout>
}

export default Hooks
