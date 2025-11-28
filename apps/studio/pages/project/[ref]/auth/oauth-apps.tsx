import { OAuthAppsList } from 'components/interfaces/Auth/OAuthApps/OAuthAppsList'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const OAuthApps: NextPageWithLayout = () => (
  <ScaffoldContainer>
    <ScaffoldSection isFullWidth>
      <OAuthAppsList />
    </ScaffoldSection>
  </ScaffoldContainer>
)

OAuthApps.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="OAuth Apps"
        secondaryActions={<DocsButton href={`${DOCS_URL}/guides/auth/oauth-server`} />}
        size="large"
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default OAuthApps
