import { AdvisorLintsPageContent } from 'components/interfaces/Advisors/AdvisorLintsPageContent'
import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'

const ProjectLints: NextPageWithLayout = () => {
  return <AdvisorLintsPageContent category="SECURITY" title="Security Advisor" hideDbInspectCTA />
}

ProjectLints.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Linter">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default ProjectLints
