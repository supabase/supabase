import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { AgentsList } from 'components/interfaces/Advisors/Agents/AgentsList'
import type { NextPageWithLayout } from 'types'

const AdvisorAgentsPage: NextPageWithLayout = () => {
  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-y-8 px-5 py-6">
      <AgentsList />
    </div>
  )
}

AdvisorAgentsPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="AI Agents">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default AdvisorAgentsPage
