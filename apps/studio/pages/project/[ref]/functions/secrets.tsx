import { EdgeFunctionSecrets } from 'components/interfaces/Functions/EdgeFunctionSecrets/EdgeFunctionSecrets'
import { FunctionsSecretsEmptyStateLocal } from 'components/interfaces/Functions/FunctionsEmptyState'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { IS_PLATFORM } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const SecretsPage: NextPageWithLayout = () => {
  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionContent className="space-y-4 md:space-y-8">
          {IS_PLATFORM ? <EdgeFunctionSecrets /> : <FunctionsSecretsEmptyStateLocal />}
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}

SecretsPage.getLayout = (page) => {
  return (
    <DefaultLayout>
      <EdgeFunctionsLayout>
        <div className="w-full min-h-full flex flex-col items-stretch">
          <PageHeader size="large">
            <PageHeaderMeta>
              <PageHeaderSummary>
                <PageHeaderTitle>Edge Function Secrets</PageHeaderTitle>
                <PageHeaderDescription>
                  Manage encrypted values for your functions
                </PageHeaderDescription>
              </PageHeaderSummary>
            </PageHeaderMeta>
          </PageHeader>

          {page}
        </div>
      </EdgeFunctionsLayout>
    </DefaultLayout>
  )
}

export default SecretsPage
