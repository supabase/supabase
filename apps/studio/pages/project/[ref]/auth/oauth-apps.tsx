import { OAuthAppsList } from 'components/interfaces/Auth/OAuthApps/OAuthAppsList'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { NextPageWithLayout } from 'types'

const OAuthApps: NextPageWithLayout = () => (
  <ScaffoldContainer>
    <ScaffoldSection>
      <div className="col-span-12">
        <FormHeader
          title="OAuth Apps"
          docsUrl="https://supabase.com/docs/guides/auth/oauth/oauth-apps"
        />
        <OAuthAppsList />
      </div>
    </ScaffoldSection>
  </ScaffoldContainer>
)

OAuthApps.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default OAuthApps
