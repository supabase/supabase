import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { ThirdPartyAuthForm } from 'components/interfaces/Auth'
import { AuthProvidersLayout } from 'components/layouts/AuthLayout/AuthProvidersLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const ThirdPartyPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  const showThirdPartyAuth = useIsFeatureEnabled('authentication:third_party_auth')

  if (!showThirdPartyAuth) {
    return <UnknownInterface urlBack={`/project/${ref}/auth/providers`} />
  }

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth provider settings" />
  }

  return (
    <ScaffoldContainer className="pb-16">
      <ThirdPartyAuthForm />
    </ScaffoldContainer>
  )
}

ThirdPartyPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthProvidersLayout>{page}</AuthProvidersLayout>
  </DefaultLayout>
)

export default ThirdPartyPage
