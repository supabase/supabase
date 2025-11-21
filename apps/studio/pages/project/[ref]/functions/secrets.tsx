import EdgeFunctionSecrets from 'components/interfaces/Functions/EdgeFunctionSecrets/EdgeFunctionSecrets'
import { FunctionsSecretsEmptyStateLocal } from 'components/interfaces/Functions/FunctionsEmptyState'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { IS_PLATFORM } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const SecretsPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer size="large">
      <ScaffoldSection isFullWidth>
        {IS_PLATFORM ? <EdgeFunctionSecrets /> : <FunctionsSecretsEmptyStateLocal />}
      </ScaffoldSection>
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
          subtitle="Manage the secrets for your project's Edge Functions"
        >
          {page}
        </PageLayout>
      </EdgeFunctionsLayout>
    </DefaultLayout>
  )
}

export default SecretsPage
