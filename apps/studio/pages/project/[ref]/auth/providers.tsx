import { useFlag } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'

import { AuthProvidersForm } from '@/components/interfaces/Auth/AuthProvidersForm'
import { BasicAuthSettingsForm } from '@/components/interfaces/Auth/BasicAuthSettingsForm'
import { CustomAuthProviders } from '@/components/interfaces/Auth/CustomAuthProviders'
import { AuthProvidersLayout } from '@/components/layouts/AuthLayout/AuthProvidersLayout'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from '@/types'

const ProvidersPage: NextPageWithLayout = () => {
  const showProviders = useIsFeatureEnabled('authentication:show_providers')
  const showCustomProviders = useIsFeatureEnabled('authentication:show_custom_providers')
  const isOauthProvidersEnabled = useFlag('CustomOauthProviders')

  return (
    <PageContainer size="default">
      <BasicAuthSettingsForm />
      {showProviders && <AuthProvidersForm />}
      {showCustomProviders && isOauthProvidersEnabled && <CustomAuthProviders />}
    </PageContainer>
  )
}

ProvidersPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthProvidersLayout>{page}</AuthProvidersLayout>
  </DefaultLayout>
)

export default ProvidersPage
