import { AdvisorRules } from 'components/interfaces/Advisors/AdvisorRules'
import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { NextPageWithLayout } from 'types'

const AdvisorRulesPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <AdvisorRules />
    </ScaffoldContainer>
  )
}

AdvisorRulesPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout>
      <PageLayout
        title="Advisor Rules"
        subtitle="Disable specific advisor categories or rules, or assign them to members for resolution"
      >
        {page}
      </PageLayout>
    </AdvisorsLayout>
  </DefaultLayout>
)

export default AdvisorRulesPage
