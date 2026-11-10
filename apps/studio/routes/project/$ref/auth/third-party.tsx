import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'

import { ThirdPartyAuthForm } from '@/components/interfaces/Auth/ThirdPartyAuthForm'
import AuthLayout from '@/components/layouts/AuthLayout/AuthLayout'
import { AuthProvidersLayout } from '@/components/layouts/AuthLayout/AuthProvidersLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

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
  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_READ
  )

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
      {isPermissionsLoaded && !canReadAuthSettings ? (
        <NoPermission isFullPage resourceText="access your project's auth provider settings" />
      ) : (
        <PageContainer size="default" className="pb-16">
          <ThirdPartyAuthForm />
        </PageContainer>
      )}
    </AuthProvidersLayout>
  )
}
