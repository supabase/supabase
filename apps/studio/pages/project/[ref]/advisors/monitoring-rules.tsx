import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { RulesList } from 'components/interfaces/Advisors/Rules/RulesList'
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

const MonitoringRulesPage: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Monitoring Rules</PageHeaderTitle>
            <PageHeaderDescription>
              Define what to watch for. Rules run SQL on a schedule and create issues when problems
              are detected.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <RulesList />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

MonitoringRulesPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Monitoring Rules">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default MonitoringRulesPage
