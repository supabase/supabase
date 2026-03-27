import { AdvisorLintsPageContent } from 'components/interfaces/Advisors/AdvisorLintsPageContent'
import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'

const ProjectLints: NextPageWithLayout = () => {
  return (
    <AdvisorLintsPageContent
      category="PERFORMANCE"
      title="Performance Advisor"
      headerClassName="py-4 px-6 !mb-0"
    />
  )
}

ProjectLints.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Linter">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default ProjectLints
