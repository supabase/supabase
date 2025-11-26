import { OAuthServerSettingsForm } from 'components/interfaces/Auth/OAuthApps/OAuthServerSettingsForm'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const ProvidersPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <OAuthServerSettingsForm />
    </ScaffoldContainer>
  )
}

const secondaryActions = [<DocsButton key="docs" href={`${DOCS_URL}/guides/auth/oauth-server`} />]

ProvidersPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="OAuth Server"
        subtitle="Configure your project to act as an identity provider for third-party applications"
        secondaryActions={secondaryActions}
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default ProvidersPage
