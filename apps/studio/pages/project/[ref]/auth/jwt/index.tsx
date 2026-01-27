import { PermissionAction } from '@supabase/shared-types/out/constants'

import { JWTSecretKeysTable } from 'components/interfaces/JwtSecrets/jwt-secret-keys-table'
import DefaultLayout from 'components/layouts/DefaultLayout'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import JWTKeysLayout from 'components/layouts/JWTKeys/JWTKeysLayout'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

const JWTSigningKeysPage: NextPageWithLayout = () => {
  const { can: canReadAPIKeys, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'auth_signing_keys'
  )

  return (
    <>
      {!isPermissionsLoaded ? (
        <GenericSkeletonLoader />
      ) : !canReadAPIKeys ? (
        <NoPermission isFullPage resourceText="access your project's API keys" />
      ) : (
        <JWTSecretKeysTable />
      )}
    </>
  )
}

JWTSigningKeysPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <JWTKeysLayout>{page}</JWTKeysLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default JWTSigningKeysPage
