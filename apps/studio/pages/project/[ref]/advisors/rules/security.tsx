import { AdvisorRules } from 'components/interfaces/Advisors/AdvisorRules'
import { AdvisorRulesLayout } from 'components/layouts/AdvisorsLayout/AdvisorRulesLayout'
import { NextPageWithLayout } from 'types'

const AdvisorSecurityRulesPage: NextPageWithLayout = () => {
  return <AdvisorRules category="security" />
}

AdvisorSecurityRulesPage.getLayout = (page) => <AdvisorRulesLayout>{page}</AdvisorRulesLayout>
export default AdvisorSecurityRulesPage
