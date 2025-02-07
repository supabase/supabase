import { PermissionAction } from '@supabase/shared-types/out/constants'

import { HooksListing } from 'components/interfaces/Auth/Hooks/HooksListing'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import {
  ScaffoldHeader,
  ScaffoldContainer,
  ScaffoldTitle,
  ScaffoldDescription,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
const Hooks: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth hooks" />
  } else {
    return (
      <div>
        <ScaffoldHeader className="pb-0">
          <ScaffoldContainer id="auth-page-top">
            <ScaffoldTitle>Auth Hooks</ScaffoldTitle>
            <ScaffoldDescription>
              Use Postgres functions or HTTP endpoints to customize the behavior of Supabase Auth to
              meet your needs
            </ScaffoldDescription>
          </ScaffoldContainer>
        </ScaffoldHeader>

        <ScaffoldContainer className="my-8 space-y-8">
          <HooksListing />
        </ScaffoldContainer>
      </div>
    )
  }
}

Hooks.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default Hooks
