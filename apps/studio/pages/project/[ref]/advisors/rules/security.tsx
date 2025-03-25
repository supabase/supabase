import { useParams } from 'common'
import { AdvisorRules } from 'components/interfaces/Advisors/AdvisorRules'
import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { NextPageWithLayout } from 'types'

const AdvisorSecurityRulesPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  return (
    <PageLayout
      title="Advisor Rules"
      subtitle="Disable specific advisor categories or rules, or assign them to members for resolution"
      navigationItems={[
        {
          label: 'Security',
          href: `/project/${ref}/advisors/rules/security`,
        },
        {
          label: 'Performance',
          href: `/project/${ref}/advisors/rules/performance`,
        },
      ]}
    >
      <AdvisorRules category="security" />
    </PageLayout>
  )
}

AdvisorSecurityRulesPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout>{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default AdvisorSecurityRulesPage
