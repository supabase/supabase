import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import OAuthAppsList from 'components/interfaces/Auth/OAuthApps/OAuthAppsList'
import type { NextPageWithLayout } from 'types'

export interface OAuthApp {
  id: string
  client_id: string
  client_secret?: string
  created_at: string
  name: string
  redirect_uris: string[]
  scopes: string[]
  // type: string
  type: 'manual' | 'dynamic'
}

const OAuthApps: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <FormHeader title="OAuth Apps" />
            <OAuthAppsList
              createTrigger={() => {}}
              editTrigger={() => {}}
              deleteTrigger={() => {}}
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}

OAuthApps.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default OAuthApps
