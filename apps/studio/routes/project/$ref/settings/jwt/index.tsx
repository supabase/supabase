import { createFileRoute } from '@tanstack/react-router'
import { IS_PLATFORM, useParams } from 'common'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { JWTSecretKeysTable } from '@/components/interfaces/JwtSecrets/jwt-secret-keys-table'
import JWTKeysLayout from '@/components/layouts/JWTKeys/JWTKeysLayout'
import { AlertError } from '@/components/ui/AlertError'
import { LocalSetupGuide } from '@/components/ui/LocalSetupGuide'
import { NoPermission } from '@/components/ui/NoPermission'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { DOCS_URL } from '@/lib/constants'
import { useGrant } from '@/lib/grants'

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
  const { ref: projectRef } = useParams()
  const signingKeysGrant = useGrant('GET /v1/projects/{ref}/config/auth/signing-keys', {
    projectRef,
  })

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
      {signingKeysGrant.status === 'loading' && <GenericSkeletonLoader />}
      {signingKeysGrant.status === 'denied' && (
        <NoPermission isFullPage resourceText="access your project's API keys" />
      )}
      {signingKeysGrant.status === 'error' && (
        <AlertError
          error={signingKeysGrant.error}
          subject="Failed to check JWT signing keys permissions"
        />
      )}
      {signingKeysGrant.status === 'granted' && <JWTSecretKeysTable />}
    </>
  )
}
