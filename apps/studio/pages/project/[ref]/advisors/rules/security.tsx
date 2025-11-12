import { AdvisorRules } from 'components/interfaces/Advisors/AdvisorRules'
import { AdvisorRulesLayout } from 'components/layouts/AdvisorsLayout/AdvisorRulesLayout'
import type { NextPageWithLayout } from 'types'

const AdvisorSecurityRulesPage: NextPageWithLayout = () => {
  return <AdvisorRules category="security" />
}

AdvisorSecurityRulesPage.getLayout = (page) => <AdvisorRulesLayout>{page}</AdvisorRulesLayout>
export default AdvisorSecurityRulesPage
