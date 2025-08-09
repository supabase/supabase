import { AuthProvidersForm, BasicAuthSettingsForm } from 'components/interfaces/Auth'
import { AuthProvidersLayout } from 'components/layouts/AuthLayout/AuthProvidersLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const ProvidersPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <BasicAuthSettingsForm />
      <AuthProvidersForm />
    </ScaffoldContainer>
  )
}

ProvidersPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthProvidersLayout>{page}</AuthProvidersLayout>
  </DefaultLayout>
)

export default ProvidersPage
