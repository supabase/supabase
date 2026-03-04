import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { AlertsList } from 'components/interfaces/Advisors/Alerts/AlertsList'
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

const AdvisorAlertsPage: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Alerts</PageHeaderTitle>
            <PageHeaderDescription>
              Raw alert log showing every time a monitoring rule fires. Each alert is linked to the
              issue it created or updated.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <AlertsList />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

AdvisorAlertsPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Alerts">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default AdvisorAlertsPage
