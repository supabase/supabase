import { PermissionAction } from '@supabase/shared-types/out/constants'

import { JWTSecretKeysTable } from 'components/interfaces/JwtSecrets/jwt-secret-keys-table'
import DefaultLayout from 'components/layouts/DefaultLayout'
import JWTKeysLayout from 'components/layouts/JWTKeys/JWTKeysLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

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
    <SettingsLayout>
      <JWTKeysLayout>{page}</JWTKeysLayout>
    </SettingsLayout>
  </DefaultLayout>
)

export default JWTSigningKeysPage
