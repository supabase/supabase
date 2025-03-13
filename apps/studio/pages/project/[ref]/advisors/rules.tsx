import { AdvisorRules } from 'components/interfaces/Advisors/AdvisorRules'
import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { NextPageWithLayout } from 'types'

const AdvisorRulesPage: NextPageWithLayout = () => {
  return <AdvisorRules />
}

AdvisorRulesPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout>{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default AdvisorRulesPage
