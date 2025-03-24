import { AdvisorRules } from 'components/interfaces/Advisors/AdvisorRules'
import { AdvisorRulesV2 } from 'components/interfaces/Advisors/AdvisorRulesV2'
import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { NextPageWithLayout } from 'types'

const AdvisorRulesPage: NextPageWithLayout = () => {
  return (
    <>
      <AdvisorRulesV2 />
      <AdvisorRules />
    </>
  )
}

AdvisorRulesPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout>{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default AdvisorRulesPage
