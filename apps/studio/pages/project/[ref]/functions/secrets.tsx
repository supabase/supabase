import { useParams } from 'common'
import { Button } from 'ui'
import EdgeFunctionSecrets from 'components/interfaces/Functions/EdgeFunctionSecrets/EdgeFunctionSecrets'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { PageContainer, PageLayout } from 'components/layouts/PageLayout'
import type { NextPageWithLayout } from 'types'
import { DocsButton } from 'components/ui/DocsButton'

const SecretsPage: NextPageWithLayout = () => {
  return (
    <PageContainer className="py-4" size="large">
      <EdgeFunctionSecrets />
    </PageContainer>
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
