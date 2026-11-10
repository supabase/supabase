import { createFileRoute } from '@tanstack/react-router'
import { IS_PLATFORM } from 'common'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { JWTSecretKeysTable } from '@/components/interfaces/JwtSecrets/jwt-secret-keys-table'
import JWTKeysLayout from '@/components/layouts/JWTKeys/JWTKeysLayout'
import { LocalSetupGuide } from '@/components/ui/LocalSetupGuide'
import { NoPermission } from '@/components/ui/NoPermission'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { DOCS_URL } from '@/lib/constants'

export const Route = createFileRoute('/project/$ref/settings/jwt/')({
  component: SettingsJwtIndexRoute,
  staticData: { settingsLayoutTitle: 'JWT Keys' },
})

// Inline the JWTKeysLayout wrap here rather than via a `settings/jwt.tsx`
// sub-shell — jwt/legacy doesn't use JWTKeysLayout, so a shared
// sub-shell would wrap legacy in the wrong layout.
function SettingsJwtIndexRoute() {
  return (
    <JWTKeysLayout>
      <JWTSigningKeysPage />
    </JWTKeysLayout>
  )
}

function JWTSigningKeysPage() {
  const { isCli, isSelfHosted } = useDeploymentMode()
  const { can: canReadAPIKeys, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_SIGNING_KEYS_READ
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
