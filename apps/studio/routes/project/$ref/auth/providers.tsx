import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from 'ui-patterns/PageContainer'

import { AuthProvidersForm } from '@/components/interfaces/Auth/AuthProvidersForm'
import { BasicAuthSettingsForm } from '@/components/interfaces/Auth/BasicAuthSettingsForm'
import { CustomAuthProviders } from '@/components/interfaces/Auth/CustomAuthProviders'
import { AuthProvidersLayout } from '@/components/layouts/AuthLayout/AuthProvidersLayout'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const Route = createFileRoute('/project/$ref/auth/providers')({
  component: AuthProvidersRoute,
  // AuthProvidersLayout wraps in <AuthLayout> internally; the auth.tsx
  // shell skips its own AuthLayout wrap so we don't double-wrap (and
  // double withAuth + ProjectLayout).
  staticData: {
    skipAuthLayout: true,
  },
})

function AuthProvidersRoute() {
  return (
    <AuthProvidersLayout>
      <ProvidersPage />
    </AuthProvidersLayout>
  )
}

function ProvidersPage() {
  const showProviders = useIsFeatureEnabled('authentication:show_providers')
  const showCustomProviders = useIsFeatureEnabled('authentication:show_custom_providers')

  return (
    <PageContainer size="default">
      <BasicAuthSettingsForm />
      {showProviders && <AuthProvidersForm />}
      {showCustomProviders && <CustomAuthProviders />}
    </PageContainer>
  )
}
