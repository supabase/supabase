import { AuthProvidersForm } from 'components/interfaces/Auth/AuthProvidersForm/AuthProvidersForm'
import { BasicAuthSettingsForm } from 'components/interfaces/Auth/BasicAuthSettingsForm/BasicAuthSettingsForm'
import { AuthProvidersLayout } from 'components/layouts/AuthLayout/AuthProvidersLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const ProvidersPage: NextPageWithLayout = () => {
  const showProviders = useIsFeatureEnabled('authentication:show_providers')

  return (
    <ScaffoldContainer>
      <BasicAuthSettingsForm />
      {showProviders && <AuthProvidersForm />}
    </ScaffoldContainer>
  )
}

ProvidersPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthProvidersLayout>{page}</AuthProvidersLayout>
  </DefaultLayout>
)

export default ProvidersPage
