import { PermissionAction } from '@supabase/shared-types/out/constants'

import { ThirdPartyAuthForm } from 'components/interfaces/Auth'
import AuthProvidersLayout from 'components/layouts/AuthLayout/AuthProvidersLayout'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { useRouter } from 'next/router'

const ThirdPartyPage: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth provider settings" />
  }

  return (
    <ScaffoldContainer className="pb-16">
      <ThirdPartyAuthForm />
    </ScaffoldContainer>
  )
}

ThirdPartyPage.getLayout = (page) => {
  const { ref: projectRef } = useRouter().query
  return <AuthProvidersLayout projectRef={projectRef as string}>{page}</AuthProvidersLayout>
}

export default ThirdPartyPage
