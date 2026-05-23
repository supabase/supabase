import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM } from 'common'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { JWTSecretKeysTable } from '@/components/interfaces/JwtSecrets/jwt-secret-keys-table'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import JWTKeysLayout from '@/components/layouts/JWTKeys/JWTKeysLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import { InlineLink } from '@/components/ui/InlineLink'
import NoPermission from '@/components/ui/NoPermission'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { SELF_HOSTED_AUTH_KEYS_DOCS_URL } from '@/lib/api/self-hosted/constants'
import type { NextPageWithLayout } from '@/types'

const JWTSigningKeysPage: NextPageWithLayout = () => {
  const { can: canReadAPIKeys, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'auth_signing_keys'
  )

  if (!IS_PLATFORM) {
    return (
      <Admonition
        type="default"
        title="Managed via configuration variables"
        description={
          <>
            Asymmetric JWT signing keys are configured outside of Studio for self-hosted
            deployments. See the{' '}
            <InlineLink href={SELF_HOSTED_AUTH_KEYS_DOCS_URL}>
              self-hosted auth keys guide
            </InlineLink>{' '}
            for setup instructions.
          </>
        }
      />
    )
  }

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
    <SettingsLayout title="JWT Keys">
      <JWTKeysLayout>{page}</JWTKeysLayout>
    </SettingsLayout>
  </DefaultLayout>
)

export default JWTSigningKeysPage
