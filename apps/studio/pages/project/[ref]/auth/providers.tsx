import { PageContainer } from 'ui-patterns/PageContainer'
import { Alert, AlertDescription, AlertTitle } from 'ui'
import { Info } from 'lucide-react'
import { IS_PLATFORM } from 'common'

import { AuthProvidersForm } from '@/components/interfaces/Auth/AuthProvidersForm'
import { BasicAuthSettingsForm } from '@/components/interfaces/Auth/BasicAuthSettingsForm'
import { CustomAuthProviders } from '@/components/interfaces/Auth/CustomAuthProviders'
import { AuthProvidersLayout } from '@/components/layouts/AuthLayout/AuthProvidersLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from '@/types'

const ProvidersPage: NextPageWithLayout = () => {
  const showProviders = useIsFeatureEnabled('authentication:show_providers')
  const showCustomProviders = useIsFeatureEnabled('authentication:show_custom_providers')

  if (!IS_PLATFORM) {
    return (
      <PageContainer size="default">
        <Alert>
          <Info />
          <AlertTitle>Auth Configuration is Managed via Environment Variables</AlertTitle>
          <AlertDescription>
            In self-hosted environments, authentication providers and settings must be configured securely via your <code>.env</code> file (e.g. <code>GOTRUE_EXTERNAL_GITHUB_ENABLED</code>). Studio cannot modify these settings dynamically.
          </AlertDescription>
        </Alert>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="default">
      <BasicAuthSettingsForm />
      {showProviders && <AuthProvidersForm />}
      {showCustomProviders && <CustomAuthProviders />}
    </PageContainer>
  )
}

ProvidersPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthProvidersLayout>{page}</AuthProvidersLayout>
  </DefaultLayout>
)

export default ProvidersPage
