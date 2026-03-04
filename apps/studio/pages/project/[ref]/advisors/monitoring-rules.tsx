import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { RulesList } from 'components/interfaces/Advisors/Rules/RulesList'
import type { NextPageWithLayout } from 'types'

const MonitoringRulesPage: NextPageWithLayout = () => {
  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-y-8 px-5 py-6">
      <RulesList />
    </div>
  )
}

MonitoringRulesPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Monitoring Rules">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default MonitoringRulesPage
