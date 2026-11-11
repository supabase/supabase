import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'

import { ThirdPartyAuthForm } from '@/components/interfaces/Auth/ThirdPartyAuthForm'
import AuthLayout from '@/components/layouts/AuthLayout/AuthLayout'
import { AuthProvidersLayout } from '@/components/layouts/AuthLayout/AuthProvidersLayout'
import { AlertError } from '@/components/ui/AlertError'
import { NoPermission } from '@/components/ui/NoPermission'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useGrant } from '@/lib/grants'

export const Route = createFileRoute('/project/$ref/auth/third-party')({
  component: ThirdPartyPage,
  // The page body wraps itself in <AuthProvidersLayout>, which already
  // includes <AuthLayout>. Tell the auth.tsx shell to skip its own
  // AuthLayout wrap so we don't double-wrap (and double withAuth +
  // ProjectLayout).
  staticData: {
    skipAuthLayout: true,
  },
})

function ThirdPartyPage() {
  const { ref } = useParams()
  const integrationsGrant = useGrant('GET /v1/projects/{ref}/config/auth/third-party-auth', {
    projectRef: ref,
  })

  const showThirdPartyAuth = useIsFeatureEnabled('authentication:third_party_auth')

  if (!showThirdPartyAuth) {
    return (
      <AuthLayout title="Sign In / Providers">
        <UnknownInterface urlBack={`/project/${ref}/auth/providers`} />
      </AuthLayout>
    )
  }

  return (
    <AuthProvidersLayout>
      {integrationsGrant.status === 'denied' && (
        <NoPermission isFullPage resourceText="access your project's auth provider settings" />
      )}
      {integrationsGrant.status === 'error' && (
        <PageContainer size="default" className="pb-16">
          <AlertError
            error={integrationsGrant.error}
            subject="Failed to check auth provider settings permissions"
          />
        </PageContainer>
      )}
      {(integrationsGrant.status === 'loading' || integrationsGrant.status === 'granted') && (
        <PageContainer size="default" className="pb-16">
          <ThirdPartyAuthForm />
        </PageContainer>
      )}
    </AuthProvidersLayout>
  )
}
