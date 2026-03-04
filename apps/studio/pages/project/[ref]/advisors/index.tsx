import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { AdvisorsOverview } from 'components/interfaces/Advisors/Overview/AdvisorsOverview'
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

const AdvisorsOverviewPage: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Advisors</PageHeaderTitle>
            <PageHeaderDescription>
              Monitor your project's health, security, and performance.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <AdvisorsOverview />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

AdvisorsOverviewPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Advisors">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default AdvisorsOverviewPage
