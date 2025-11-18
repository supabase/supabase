import { OAuthAppsList } from 'components/interfaces/Auth/OAuthApps/OAuthAppsList'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const OAuthApps: NextPageWithLayout = () => (
  <PageContainer size="default">
    <PageSection>
      <PageSectionContent>
        <FormHeader
          title="OAuth Apps"
          docsUrl="https://supabase.com/docs/guides/auth/oauth/oauth-apps"
        />
        <OAuthAppsList />
      </PageSectionContent>
    </PageSection>
  </PageContainer>
)

OAuthApps.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default OAuthApps
