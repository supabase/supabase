import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { IssuesList } from 'components/interfaces/Advisors/Issues/IssuesList'
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

const AdvisorIssuesPage: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Issues</PageHeaderTitle>
            <PageHeaderDescription>
              Track and resolve problems detected by monitoring rules.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <IssuesList />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

AdvisorIssuesPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Issues">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default AdvisorIssuesPage
