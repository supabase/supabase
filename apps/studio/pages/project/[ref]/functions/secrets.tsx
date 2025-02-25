import EdgeFunctionSecrets from 'components/interfaces/Functions/EdgeFunctionSecrets/EdgeFunctionSecrets'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import type { NextPageWithLayout } from 'types'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
const SecretsPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer size="large" className="pt-6">
      <EdgeFunctionSecrets />
    </ScaffoldContainer>
  )
}

SecretsPage.getLayout = (page) => {
  return (
    <DefaultLayout>
      <EdgeFunctionsLayout>
        <PageLayout
          size="large"
          title="Edge Function Secrets"
          subtitle="Manage the secrets for your project's edge functions"
        >
          {page}
        </PageLayout>
      </EdgeFunctionsLayout>
    </DefaultLayout>
  )
}

export default SecretsPage
