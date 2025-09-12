import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { ThirdPartyAuthForm } from 'components/interfaces/Auth/ThirdPartyAuthForm'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import { AuthProvidersLayout } from 'components/layouts/AuthLayout/AuthProvidersLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const ThirdPartyPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  const showThirdPartyAuth = useIsFeatureEnabled('authentication:third_party_auth')

  if (!showThirdPartyAuth) {
    return (
      <AuthLayout>
        <UnknownInterface urlBack={`/project/${ref}/auth/providers`} />
      </AuthLayout>
    )
  }

  return (
    <AuthProvidersLayout>
      {isPermissionsLoaded && !canReadAuthSettings ? (
        <NoPermission isFullPage resourceText="access your project's auth provider settings" />
      ) : (
        <ScaffoldContainer className="pb-16">
          <ThirdPartyAuthForm />
        </ScaffoldContainer>
      )}
    </AuthProvidersLayout>
  )
}

ThirdPartyPage.getLayout = (page) => <DefaultLayout>{page}</DefaultLayout>

export default ThirdPartyPage
