import { PermissionAction } from '@supabase/shared-types/out/constants'

import {
  AuthProvidersForm,
  ProtectionAuthSettingsForm,
  ThirdPartyAuthForm,
} from 'components/interfaces/Auth'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldHeader, ScaffoldContainer, ScaffoldTitle } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth provider settings" />
  } else {
    return (
      <div>
        <ScaffoldHeader className="pb-0">
          <ScaffoldContainer id="auth-page-top">
            <ScaffoldTitle>Attack Protection</ScaffoldTitle>
          </ScaffoldContainer>
        </ScaffoldHeader>

        <ScaffoldContainer className="my-8 space-y-8">
          <ProtectionAuthSettingsForm />
        </ScaffoldContainer>
      </div>
    )
  }
}

PageLayout.getLayout = (page) => {
  return (
    <DefaultLayout>
      <AuthLayout>{page}</AuthLayout>
    </DefaultLayout>
  )
}
export default PageLayout
