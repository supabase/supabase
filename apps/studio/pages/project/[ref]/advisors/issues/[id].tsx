import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { IssueDetail } from 'components/interfaces/Advisors/Issues/IssueDetail'
import type { NextPageWithLayout } from 'types'

const AdvisorIssueDetailPage: NextPageWithLayout = () => {
  return <IssueDetail />
}

AdvisorIssueDetailPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Issue Detail">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default AdvisorIssueDetailPage
