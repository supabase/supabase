import { AdvisorRules } from 'components/interfaces/Advisors/AdvisorRules'
import { AdvisorRulesLayout } from 'components/layouts/AdvisorsLayout/AdvisorRulesLayout'
import { NextPageWithLayout } from 'types'

const AdvisorPerformanceRulesPage: NextPageWithLayout = () => {
  return <AdvisorRules category="performance" />
}

AdvisorPerformanceRulesPage.getLayout = (page) => <AdvisorRulesLayout>{page}</AdvisorRulesLayout>
export default AdvisorPerformanceRulesPage
