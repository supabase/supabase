import { useParams } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { ProjectSecretsSection } from '@/components/interfaces/Workers/Secrets/ProjectSecretsSection'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { WorkersLayout } from '@/components/layouts/WorkersLayout/WorkersLayout'
import type { NextPageWithLayout } from '@/types'

const WorkersSecretsPage: NextPageWithLayout = () => {
  const { ref } = useParams()

  return (
    <div className="w-full min-h-full flex flex-col items-stretch">
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Secrets</PageHeaderTitle>
            <PageHeaderDescription>
              Environment variables loaded into every worker at start-up
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            {ref && <ProjectSecretsSection projectRef={ref} />}
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </div>
  )
}

WorkersSecretsPage.getLayout = (page) => (
  <DefaultLayout>
    <WorkersLayout title="Secrets">{page}</WorkersLayout>
  </DefaultLayout>
)

export default WorkersSecretsPage
