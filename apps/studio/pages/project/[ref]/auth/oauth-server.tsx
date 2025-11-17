import { OAuthServerSettingsForm } from 'components/interfaces/Auth/OAuthApps/OAuthServerSettingsForm'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const ProvidersPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <OAuthServerSettingsForm />
    </ScaffoldContainer>
  )
}

ProvidersPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="OAuth Server"
        subtitle="Configure your project to act as an identity provider for third-party applications"
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default ProvidersPage
