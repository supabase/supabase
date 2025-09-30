import { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'

const AuthOverview: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>Overview</ScaffoldSection>
    </ScaffoldContainer>
  )
}

AuthOverview.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="Overview"
        secondaryActions={<DocsButton href={`${DOCS_URL}/guides/auth`} />}
        size="large"
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default AuthOverview
