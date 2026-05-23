import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM } from 'common'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { JWTSecretKeysTable } from '@/components/interfaces/JwtSecrets/jwt-secret-keys-table'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import JWTKeysLayout from '@/components/layouts/JWTKeys/JWTKeysLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import { LocalSetupGuide } from '@/components/ui/LocalSetupGuide'
import NoPermission from '@/components/ui/NoPermission'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { DOCS_URL } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const JWTSigningKeysPage: NextPageWithLayout = () => {
  const { can: canReadAPIKeys, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'auth_signing_keys'
  )

  if (!IS_PLATFORM) {
    return (
      <LocalSetupGuide
        cli={{
          body: (
            <p>
              Asymmetric JWT signing keys are not managed via Studio for local development. The
              Supabase CLI signs JWTs using the symmetric{' '}
              <code className="text-code-inline">JWT_SECRET</code> from{' '}
              <code className="text-code-inline">supabase/config.toml</code>.
            </p>
          ),
          docsHref: `${DOCS_URL}/guides/local-development`,
        }}
        selfHosted={{
          body: (
            <p>
              Configure asymmetric JWT signing keys outside of Studio via your{' '}
              <code className="text-code-inline">.env</code> and{' '}
              <code className="text-code-inline">docker-compose.yml</code>.
            </p>
          ),
          docsHref: `${DOCS_URL}/guides/self-hosting/self-hosted-auth-keys`,
        }}
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
