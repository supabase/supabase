import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { IssuesList } from 'components/interfaces/Advisors/Issues/IssuesList'
import type { NextPageWithLayout } from 'types'

const AdvisorIssuesPage: NextPageWithLayout = () => {
  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-y-8 px-5 py-6">
      <IssuesList />
    </div>
  )
}

AdvisorIssuesPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Issues">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default AdvisorIssuesPage
