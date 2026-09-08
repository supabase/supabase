import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM } from 'common'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { JWTSecretKeysTable } from '@/components/interfaces/JwtSecrets/jwt-secret-keys-table'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import JWTKeysLayout from '@/components/layouts/JWTKeys/JWTKeysLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import { LocalSetupGuide } from '@/components/ui/LocalSetupGuide'
import { NoPermission } from '@/components/ui/NoPermission'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { DOCS_URL } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const JWTSigningKeysPage: NextPageWithLayout = () => {
  const { isCli, isSelfHosted } = useDeploymentMode()
  const { can: canReadAPIKeys, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'auth_signing_keys'
  )

  if (!IS_PLATFORM) {
    return (
      <div className="space-y-4">
        {isCli && (
          <LocalSetupGuide
            variant="cli"
            body={
              <p>
                The asymmetric key pair used to sign user session JWTs is configured by the Supabase
                CLI.
              </p>
            }
            docsHref={`${DOCS_URL}/guides/local-development`}
          />
        )}
        {isSelfHosted && (
          <LocalSetupGuide
            variant="selfHosted"
            body={
              <p>
                The asymmetric key pair used to sign user session JWTs is configured via environment
                variables.
              </p>
            }
            docsHref={`${DOCS_URL}/guides/self-hosting/self-hosted-auth-keys`}
          />
        )}
      </div>
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
