import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { AgentsList } from 'components/interfaces/Advisors/Agents/AgentsList'
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

const AdvisorAgentsPage: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>AI Agents</PageHeaderTitle>
            <PageHeaderDescription>
              Configure AI assistants that can analyze issues and suggest fixes.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <AgentsList />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

AdvisorAgentsPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="AI Agents">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default AdvisorAgentsPage
